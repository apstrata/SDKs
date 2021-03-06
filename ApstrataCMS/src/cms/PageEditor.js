dojo.provide("apstrata.cms.PageEditor");

dojo.require("dojox.dtl._Templated");
dojo.require("dijit._editor.plugins.ViewSource");
dojo.require("apstrata.horizon.util._Templated");
dojo.require("apstrata.horizon.Panel");
dojo.require("dijit.layout.TabContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.SimpleTextarea");

dojo.require("apstrata.cms.PageSelector");

/**
 * This class provides an editor to create/update page documents
 * The content of the document is displayed/edited in three distinct tabs.
 * @param params.attrs.doc (optional) the page document to load into the page editor instance 
 * @param params.attrs.store (optional) the store where to update, defaults to "apstrata"
 * @param params.attrs.connection (option) the connection to use to Apstrata account. Defaults to this.container.connection
 */
dojo.declare("apstrata.cms.PageEditor", 
[apstrata.horizon.Panel], 
{
	templatePath: dojo.moduleUrl("apstrata.cms", "templates/PageEditor.html"),
	widgetsInTemplate: true,
	_store: "apstrata",
	_connection: null,
	
	// the mode is in "edit" mode (true) if the consructor receives a value. It is "new" mode (false) otherwise
	_mode: true,

	// the form generator that will handle the data retrieved from the page
	_formGenerator: null,
	
	// the form definition of the page document
	_pageFormDefinition: null,
	
 	constructor: function(params) {
		
		var value = params && params.attrs.doc ? params.attrs.doc : null;
		this._mode = value ? true : false;
		this._store = params && params.attrs.store ? params.attrs.store : this._store;
		this.maximizePanel = params && params.attrs.maximizePanel ? params.attrs.maximizePanel : false;		
		this._specifyFormDefinition();
		this._formGenerator = new apstrata.ui.forms.FormGenerator(
			{
				definition: this._pageFormDefinition,
				
				// change the below to new (or anthing else) when you need to create a new document
				// set it to "edit" when you need to retrieve an existing document into the form
				//displayGroups: value ? "edit" : "new",	
				value: value,
				save: dojo.hitch(this, this.save),
				submitOnEnter: true
			}
		);				
		
		this.inherited(arguments);
	},
	
	/*
	 * Saves the form content into a corresponding document in the Apstrata store
	 */
	save: function(value) {
		
		var self = this;
		this.showAsBusy(true, "Saving page...");	
		this._handleFormEditorBug();
				
		var params = {											
				"apsdb.update": this._mode,
				"apsdb.store": this._store,
				"apsdb.schema": "cms_page",
				"section1.apsdb.fieldType": "text",
				"section2.apsdb.fieldType": "text",
				"javascript.apsdb.fieldType": "text",
				"css.apsdb.fieldType": "text",
				"publishedDate.apsdb.fieldType": "date",
				"searchEngineMetaTags.apsdb.fieldType": "text",
				"parent": this._formGenerator.getField("parent").value	
		};	
		
		// Important:
		// In _arrangeLayout(), we split the form fields into the three tabs. However, the form
		// is only contained into the first tab, hence, submitting the form will not submit
		// the fields contained in the second and third tab. Therefore, we need to "manually" add
		// these remaining fields to the params variable below. 	 
		
		// We need to change the tags ListInput value into a string of tags separated by ','			
		params["tags"] = this._tagsAsString(this._formGenerator.getField("tags").value);
								
		params["description"] = this._formGenerator.getField("description").value;
		params["category"] = this._formGenerator.getField("category").value;
		params["javascript"] = this._formGenerator.getField("javascript").value;
		params["css"] = this._formGenerator.getField("css").value;
		params["category"] = this._formGenerator.getField("category").value;		
		params["document.readACL"] = this._formGenerator.getField("document.readACL").value;
		params["order"] = this._formGenerator.getField("order").value;
		params["order.apsdb.fieldType"] = this._formGenerator.getField("order").type;
		
		// We will only send the publishedDate if the status is "Published"
		// If no date/time was set, we use the current date/time
		var status = this._formGenerator.getField("pageStatus").value;
		params["pageStatus"] = status;
		if (status == "Published" && !this._formGenerator.getField("publishedDate").value) {
							
			params["publishedDate"] = this._formatDate();			
		}else {			
			if (status == "Published" && this._formGenerator.getField("publishedDate").value) {
				
				params["publishedDate"] = this._formGenerator.getField("publishedDate").value;			
			}
		}
		
		params["searchEngineMetaTags"] = this._formGenerator.getField("searchEngineMetaTags").value;
		
		var client = new apstrata.sdk.Client(this._connection);
		client.call("SaveDocument", params, this._formGenerator.frmMain.domNode, {method:"post"}).then( 
		
			function(response){
												
				self._alert("Page successfully updated")
				self.getParent().refresh();
				self.showAsBusy(false);
			},
			
			function(response) {
				
				self.showAsBusy(false);	
				var errorMsg= response.metadata.errorDetail ? response.metadata.errorDetail : response.metadata.errorCode;
				self._alert(errorMsg ? errorMsg : "An error has occured", "errorIcon");
			}
		)		
	},
	
	postCreate: function() {
						
		this.inherited(arguments);
	},
	
	startup: function() {
		
		dojo.style(this.domNode, "height", "100%");					
		this._arrangeLayout();	
		this.inherited(arguments);	
	},
	
	/*
	 * Splits the different groups of the form built by the form generator into
	 * the different tabs of the tabbed layout container.
	 */
	_arrangeLayout: function() {
		
		var self = this;
		
		dojo.place(this._formGenerator.domNode, this.editorial.domNode);
				
		// Query for the node having a "setLabel" class. They are located right before the
		// group fieldsets
		var groups = dojo.query(".setLabel");
		if (groups) {
							
			// move the "code" group to the code div
			var codeGroup = groups[1].nextSibling;
			dojo.destroy(groups[1]);
			dojo.place(codeGroup, this.code.domNode);
									
			// move the "metadata" group to the metadata div
			var metadataGroup= groups[2].nextSibling;
			dojo.destroy(groups[2]);
			dojo.place(metadataGroup, this.metadata.domNode);											 			
		}
		
		var saveParts = dojo.hitch(this, this._savePart);
		dojo.connect(this.saveBtn, "onClick", saveParts);
		
		var closeMe = dojo.hitch(this, this.close);
		dojo.connect(this.closeBtn, "onClick", closeMe);	
		
		
		//This is a workaround for displaying the css and javascript fields values.
		if (this._formGenerator && this._formGenerator.value) {
			var cssValue = 	this._formGenerator.value.css;
			if (cssValue) {
				this._formGenerator.getField("css").set("value", cssValue);	
			}
		}
	},
	
	/*
	 * This function is called by the save buttons placed on top of every content page (tab)
	 * It validates the form then calls the save() function
	 */
	_savePart: function(target) {
		
		var isValid = this._formGenerator.validate();
		if (isValid) {
			
			this.save(this._formGenerator.value);
		}
	},
	
	/*
	 * This function instanciates the _pageFormDefinition attribute of the current class.
	 * We need to have this in a function (instead of a direct instanciation of the attribute)
	 * because we need to allocate the value of other attributes (this._connection mainly)
	 * to some of the definition properties (mainly connection)
	 */
	_specifyFormDefinition: function() {
		
		if (!this._connection) {
			this._connection = new apstrata.sdk.Connection(this.container.connection);
		}
				
		this._pageFormDefinition =  {
			fieldset: [
				
				// definition of the "editorial" tab
				{name: "editorial",  type: "subform", 
					
					fieldset: [						
						{name: "apsdb.documentKey", label: "Page ID", required: true, type: "string"},
						{name: "windowTitle", label: "Window Title", type: "string", required: true},
						{name: "title", label: "Page Title", type: "string", required: true},
						{name: "section1", label: "Body: first section", type: "string", widget: "dijit.Editor", height: "200px", plugins: ['bold','italic','|','createLink','foreColor','hiliteColor',{name:'dijit._editor.plugins.FontChoice', command:'fontName', generic:true}, 'fontSize','formatBlock','insertImage','insertHorizontalRule'], extraPlugins: ['viewSource']},
						{name: "section2", label: "Body: second section", type: "string", widget: "dijit.Editor", height: "200px", plugins: ['bold','italic','|','createLink','foreColor','hiliteColor',{name:'dijit._editor.plugins.FontChoice', command:'fontName', generic:true},'fontSize','formatBlock','insertImage','insertHorizontalRule'], extraPlugins: ['viewSource']},
						{name: "template", label:"Template", type: "string", widget: "dijit.form.ComboBox", "formGenerator-options": ["Wide", "Two columns"]},
						{name: "attachments", label: "Attachments", type: "multiplefiles", connection: this._connection, displayImage:false, value:""},
						{name: "smallIcon", label:"Small icon", type: "file", displayImage:true, connection: this._connection, store: this._store, value:"", showRemoveFieldBtn: true},
						{name: "regularIcon", label:"Regular Icon", type: "file", displayImage:true, connection: this._connection, store: this._store, value:"",showRemoveFieldBtn: true},
						{name: "documentType", type: "hidden", value: "page"},
						{name: "parent", label:"Parent", type: "string", widget: "apstrata.cms.PageSelector", connection: this.container.connection}
					]
				},
	
				// definition of the "JS/CSS" tab
				{name: "Code",  type: "subform",
					fieldset: [						 
						{name: "javascript", label: "JavaScript", type: "string", widget: "dijit.Editor", height: "200px", plugins: ['bold','italic','|','createLink','foreColor','hiliteColor',{name:'dijit._editor.plugins.FontChoice', command:'fontName', generic:true},'fontSize','formatBlock','insertImage','insertHorizontalRule'], extraPlugins: ['viewSource']},
						{name: "javascript", label: "JavaScript", type: "hidden"},
						{name: "css", label: "CSS", type: "string", widget: "dijit.Editor", height: "200px", plugins: ['bold','italic','|','createLink','foreColor','hiliteColor',{name:'dijit._editor.plugins.FontChoice', command:'fontName', generic:true},'fontSize','formatBlock','insertImage','insertHorizontalRule'], extraPlugins: ['viewSource']},			
					]				
				},
		
				// definition of the "metadata" tab
				{name: "Metadata",  type: "subform",
					fieldset: [
						{name: "description", label: "Description", type: "string"},
						{name: "category", label: "Category", type: "string", type: "string", value: "Editorial", widget: "dijit.form.ComboBox", "formGenerator-options": ["Editorial", "Product", "Blog"]},
						{name: "order", label: "Page Order", type: "numeric"},
						{name: "tags", label:"tags", type: "string", widget: "dojox.form.ListInput"},
						{name: "pageStatus", label: "Status", type: "string", type: "string", value: "Draft", widget: "dijit.form.ComboBox", "formGenerator-options": ["Published", "Draft", "Pending Approval"]},
						{name: "document.readACL", label: "Read permissions", type: "string"},
						{name: "publishedDate", label: "Published date", type: "string"},
						{name: "searchEngineMetaTags", label: "Search Engine Meta Tags (excluding creation and modification dates)", type: "string", widget: "dijit.form.SimpleTextarea"}
					]
				},
			],
			
			actions: ['save']
		}
	},
	
	/*
	 * Utility function that formats a date to the format that is expected by Apstrata
	 * (yyyy-MM-dd'T'HH:mm:ssZ)
	 * @param aDate: the date/time to format. If undefined, will take the current date/time
	 * @return the formatted date
	 */
	_formatDate: function(aDate) {
		
		var date = aDate ? aDate: new Date();
		var fDate = dojo.date.locale.format(date, {datePattern: "yyyy-MM-dd'T'", timePattern: "HH:mm:ssZ"});
		fDate = fDate.replace(/\T /g, "T");
		return fDate;
	},
	
	/*
	 * Utility function that turns an array of string tags into a string where tags are 
	 * separated with ","
	 */
	_tagsAsString: function(tagsArray) {
		
		var tagsStr = "";
		for (var i = 0; i < tagsArray.length; i++) {			
			tagsStr += tagsArray[i] + "," 
		}
		
		return tagsStr.substring(0, tagsStr.length - 1);
	},
	
	/*
	 * Caution:
	 * This function is only required due to a dojo bug in the FormGenerator: when submitting the form node,
	 * the value of dijit.Editors is not sent along the other data. This section is a quick workaround
	 * but should be removed when the bug is fixed (i.e. this fix to be added to the form generator)
	 */	
	_handleFormEditorBug: function() {
				
		dojo.require("dijit.form.Textarea");
		if (!this._section1TextArea) {				
			this._section1TextArea = new dijit.form.Textarea({name:"section1", style:"display:none"});
			dojo.place(this._section1TextArea.domNode, this._formGenerator.frmMain.domNode);
		}
		
		this._section1TextArea.set("value", this._formGenerator.getField("section1").value);		
		
		if (!this._section2TextArea) {
			this._section2TextArea = new dijit.form.Textarea({name:"section2", style:"display:none"});
			dojo.place(this._section2TextArea.domNode, this._formGenerator.frmMain.domNode);
		}
		
		this._section2TextArea.set("value", this._formGenerator.getField("section2").value);
		
		if (!this._javascriptTextArea) {				
			this._javascriptTextArea = new dijit.form.Textarea({name:"javascript", style:"display:none"});
			dojo.place(this._javascriptTextArea.domNode, this._formGenerator.frmMain.domNode);
		}
		
		this._javascriptTextArea.set("value", this._formGenerator.getField("javascript").value);
		
		if (!this.cssArea) {				
			this.cssArea = new dijit.form.Textarea({name:"css", style:"display:none"});
			dojo.place(this.cssArea.domNode, this._formGenerator.frmMain.domNode);
		}
		
		this.cssArea.set("value", this._formGenerator.getField("css").value);		
	},
	
	/*
	 * Displays an alert message
	 */
	_alert: function(message, iconClass){
		
		var self = this;
		new apstrata.horizon.PanelAlert({
			panel: self,
			width: 320,
			height: 140,
			iconClass: iconClass,
			message: message,
			actions: ['OK'],
			actionHandler: function(action){
				self.closePanel();
			}
		});
	},	
})
