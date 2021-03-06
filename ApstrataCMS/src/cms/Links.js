/*******************************************************************************
 *  Copyright 2009-2012 Apstrata
 *  
 *  This file is part of Apstrata Database Javascript Client.
 *  
 *  Apstrata Database Javascript Client is free software: you can redistribute it
 *  and/or modify it under the terms of the GNU Lesser General Public License as
 *  published by the Free Software Foundation, either version 3 of the License,
 *  or (at your option) any later version.
 *  
 *  Apstrata Database Javascript Client is distributed in the hope that it will be
 *  useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *  
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with Apstrata Database Javascript Client.  If not, see <http://www.gnu.org/licenses/>.
 * *****************************************************************************
 */
dojo.provide("apstrata.cms.Links")

dojo.require("apstrata.horizon.NewList")

dojo.require("apstrata.sdk.ObjectStore")

dojo.require("apstrata.horizon.WrapperPanel")
 
dojo.require("dijit.Editor")
dojo.require("dijit._editor.plugins.FontChoice");  // 'fontName','fontSize','formatBlock'
dojo.require("dijit._editor.plugins.TextColor");
dojo.require("dijit._editor.plugins.LinkDialog");
dojo.require("dojox.form.ListInput")
 
dojo.declare("apstrata.cms.Links",
[apstrata.horizon.NewList], 
{	
	//
	// widget attributes
	//
	_mode: "new",
	_store: "apstrata",
	_formGenerator: null,
	filterable: true,
	sortable: true,
	editable: true,
	multiEditMode: false,

	newObjectPanel: null,
	
	linkFormDefinition:  null,
	
	// index of the essential item properties
	idAttribute: 'apsdb.documentKey',
	labelAttribute: 'title',
	
	constructor: function() {
		var self = this

		this._setFormDefinition();
		this.store = new apstrata.sdk.ObjectStore({
					connection: self.container.connection,
					store: "apstrata",
					queryFields: "*",
					queryExpression: "documentType =\"link\"" 
				})
	},
	
	itemIsDeleteable: function(item) {
		return true
	},

	itemIsEditable: function(item) {
		return false
	},
	
	postCreate: function() {
		dojo.addClass(this.domNode, "linksList")
		this.inherited(arguments)
	},

	openEditor: function(value) {
		var self = this;
		this._mode = value ? "edit" : "new";

		this.openPanel(apstrata.horizon.WrapperPanel, {
			widgetClass: "apstrata.ui.forms.FormGenerator",
			maximizable: true,
			cssClass: "pageEditor",
			attrs: {				
			
				definition: self.linkFormDefinition,
				save: dojo.hitch(self, self.save),
				value: value 
			}
		});
		
		this._formGenerator = this._openPanel.getWidget();
	},

	onNew: function() {
		this.openEditor()
	},

	onClick: function(id, args) {
		var self = this	

		self.store.get(id).then(function(doc) {
			self.openEditor(doc)
		})
	},
	
	onDeleteItem: function(id) {
		var self = this
		this.store.remove(id).then(function() {self.reload()})
	},
	
	save: function(value) {		
		
		var self = this;
		var params = {		
												
				"apsdb.update": this._mode == "edit" ? true : false,
				"apsdb.store": this._store,
				"apsdb.schema": "cms_link"
		};	

								
		var client = new apstrata.sdk.Client(this.container.connection);
		client.call("SaveDocument", params, this._formGenerator.frmMain.domNode, {method:"post"}).then( 
		
			function(response){
												
				self._alert("Link successfully updated")
				self.parentList.refresh();				
			},
			
			function(response) {				
			
				var errorMsg= response.metadata.errorDetail ? response.metadata.errorDetail : response.metadata.errorCode;
				self._alert(errorMsg ? errorMsg : "An error has occured", "errorIcon");
			}
		)		
	},
	
	_setFormDefinition: function() {
		
		this.linkFormDefinition = {
			label: "Link",
			fieldset: [
				{name: "apsdb.documentKey", label: "Link id", type: "string", required:true},
				{name: "title", type: "string", required: true},
				{name: "address", type: "string", required: true},
				{name: "description", type: "string", required: false},
				{name: "target", label: "type", type: "string", widget: "dijit.form.ComboBox", "formGenerator-options": ["_blank", "_top", "_none"]},
				{name: "category", label: "Category", type: "string"},
				{name: "order", label: "Order", type: "numeric"},
				{name: "order.apsdb.fieldType", label: "Order Type", type: "hidden", value: "numeric"},
				{name: "attachments", label: "Attachments", type: "multiplefiles", connection: this._connection, displayImage:false, value:""},
				{name: "regularIcon", label:"Regular Icon", type: "file", displayImage:true, connection: this.container.connection, store: this._store, value:"",showRemoveFieldBtn: true},
				{name: "document.readACL", type:"string"},
				{name: "smallIcon", label:"Small icon", type: "file", displayImage:true, connection: this.container.connection, store: this._store, value:"", showRemoveFieldBtn: true},
				{name: "parent", type: "string"},
				{name: "documentType", type: "hidden", value: "link"}				
			],
			
			actions: ['save']
		}
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
	}
})


