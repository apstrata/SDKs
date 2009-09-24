/*******************************************************************************
 *  Copyright 2009 Apstrata
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

dojo.provide("surveyWidget.widgets.Survey");

dojo.require("dijit._Templated");
dojo.require("dijit.layout.LayoutContainer");
dojo.require("surveyWidget.widgets.SurveyField");
dojo.require("dojo.dnd.Container");
dojo.require("dojo.dnd.Manager");
dojo.require("dojo.dnd.Source");

dojo.declare("surveyWidget.widgets.Survey",
	[dijit._Widget, dijit._Templated],
	{
		widgetsInTemplate: true,
		templateString: null,
		templatePath: dojo.moduleUrl("surveyWidget.widgets", "templates/Survey.html"),
		jsonDataModel: "{}",
		editMode: true,
		questionContainer: null,
		dataModel: null,
		surveyTitle : "Type the survey title here",
		surveyDescription : "You can place the survey description here.",
		fieldSerialNumber: 0,

		//
		// Replace here with your store name
		//
		storeName: "myStore",

		constructor: function() {
			if(schema != null)
				this.jsonDataModel = decodeURIComponent(schema);

			dataModel = dojo.fromJson(this.jsonDataModel);

			if (dataModel.title != null) this.surveyTitle = dataModel.title;
			if (dataModel.description != null) this.surveyDescription = dataModel.description;
			
			if(this.getUrlParam("editMode") == "true"){
				this.editMode = true;
			} else{
				this.editMode = false;
				this.templatePath = dojo.moduleUrl("surveyWidget.widgets", "templates/SurveyRun.html");
			}
		},
		
		postCreate: function(){
			// Assemble the cookie name
			var strTitleForCookie = this.surveyTitle.replace(/ /g, ''); // Remove all spaces from the survey title
			strTitleForCookie = (strTitleForCookie.length > 30) ? strTitleForCookie.substring(0, 30) : strTitleForCookie;
			var cookie = 'apstrata.' + apstrata.apConfig.key + '.' + strTitleForCookie;
			
			// Make sure that this user has not already taken the survey and already a cookie
			if (dojo.cookie(cookie) == 'taken') {
				if (dataModel.viewResults) {
					window.location = dataModel.resultsUrl;
				} else {
					this.surveyDiv.style.display = 'none';
					this.successMessage.innerHTML = dataModel.successMessage;
				}
			} else {
			this.inherited(arguments);
			// when clicking on "get Data Model" the getModel function is called
			if (this.editMode) {
				this.connect(this.btnGetData, "onclick", "getModel");
				this.connect(dojo.byId("viewResultsId"), "onclick", "toggleTextBox");
			}
			else {
				this.connect(this.btnSubmit, "onclick", "saveSurvey");
			}

			this.questionContainer = this.initDnd();
			var survey = this;

			dojo.forEach(dataModel.questions, function(fieldDataModel) {
				// Do not show the 'apsdbSchema' field
				var isVisible = (fieldDataModel.name != 'apsdbSchema');
				var newField = survey.createField(fieldDataModel, isVisible);
			});

			if(this.editMode)
				var newField = this.createField(null, true);
			}
		},
		
		initDnd: function() {
			src = new dojo.dnd.Source(dojo.byId("dndContainer"),{withHandles:true});
			return(src);
		},
		
		deselectFields: function() {
		},
		
		toggleTextBox: function() {
			if(this.viewResults.checked)
				this.successMsgDiv.style.display = "none";
			else
				this.successMsgDiv.style.display = "";
		},
		
		createField: function(dataModel, isVisible) {
			var newField = new surveyWidget.widgets.SurveyField(dataModel, this.editMode, ++this.fieldSerialNumber);

			// Do not display the field that should be invisible
			if (!isVisible) {
				newField.surveyField.style.display = 'none';
			}

			this.questions.addChild(newField);

			newField.setParent(this);

			var survey = this;
			
			this.connect(newField , "fieldModified", function() {
					if (this.editMode) {
						var children = this.questions.getChildren();
						if (newField.dummyField) {
							this.createField(null, true);
							newField.dummyField = false;
						}
					}
				});


			this.connect(newField , "selectedEvent", function () {
					if (this.editMode) {
						dojo.forEach(this.questions.getChildren(), function(child) {
							if(child.selected)
								child.restoreInitialState();
							child.unselect();	
						});
						newField.select();
					}
				});
				
			this.connect(newField , "saveInitialState", function () {
					if (this.editMode) {
						this.setInitialState(newField);
					}
				});

			return newField;
		},
		
		setInitialState: function(newField) {
			if (!newField.selected) {
				var jsonObj = this.surveyform.getValues();
				
				newField.initialState = {
					title: newField.title,
					type: newField.lstType.value,
					choices: newField.txtChoices.value,
					mandatory: newField.chkMandatory.checked,
					fieldValue: jsonObj[newField.fldName.value]
				}
			}
		},
		
		startup: function(){
			this.inherited(arguments);
		},
		
		getData: function() {
			var data = new Array();
			var i=0;
			dojo.forEach(this.questions.getChildren(), function(child) {
				if (!(child.title == null)) data[i++] = child.getData();
			});
			return data;
		},
		
		getModel: function() {
			var self = this;
			var jsonObj = this.surveyform.getValues();
			var data = new Array();
			var arrFields = new Array();
			var arrTitleFields = new Array();
			var childModel = null;
			var i=0;
			var j=0;
			var k=0;
			var schemaFieldArr = new Array();

			var children = this.questions.getChildren();
			var breakProcessing = false;
			dojo.forEach(this.questions.getChildren(), function(child) {
				if (breakProcessing) {
					// Do nothing
				} else if (child.title != null && child.title != '' && !child.dummyField) {
					childModel = child.getModel();
					childModel["defaultValue"] = jsonObj[child.fieldName];
					data[i] = childModel;

					// Create an XML schema field object
					schemaFieldArr[i] = new SchemaField(childModel.name, "string", false);
					if (childModel.mandatory)
						schemaFieldArr[i].setCardinalities(1, null); // Make the field mandatory

					i++;
				} else if ((child.title == null || child.title == '') && !child.dummyField) { // Check that all questions have titles
					child.select(); // Select the empty question
					self.warningMessage.style.display = ''; // Display the warning message
					self.warningMessage.innerHTML = 'All questions must have a title!';
					breakProcessing = true;
				}
			});

			// Stop processing the embed codes if a warning message was displayed
			if (breakProcessing)
				return;

			self.warningMessage.style.display = 'none'; // Hide the warning message in case it was displayed before

			// Create a new object for the schema name and insert it as a survey field
			// The schema name must be between 3-32 characters long: [user key]_[survey title]_[random hash]
			var strTitleForSchema = this.cleanTitleForSchemaName(this.title.value);
			var schemaName = apstrata.apConfig.key + '_' + strTitleForSchema + '_' + dojox.encoding.digests.MD5('' + new Date().getTime() + data, dojox.encoding.digests.outputTypes.Hex).toUpperCase().substring(0, 10);

			var apstrataSurveySchemaName = new Object();
			apstrataSurveySchemaName.choices = '';
			apstrataSurveySchemaName.defaultValue = schemaName;
			apstrataSurveySchemaName.mandatory = false;
			apstrataSurveySchemaName.name = 'apsdbSchema';
			apstrataSurveySchemaName.title = 'Apstrata Survey Schema Name';
			apstrataSurveySchemaName.type = 'text';
			data[i++] = apstrataSurveySchemaName;

			dojo.forEach(this.questions.getChildren(), function(child) {
				if (child.title != null && !child.dummyField) {
					arrFields[j++] = child.fldName.value;
					arrTitleFields[k++] = child.fldTitle.value;
				}
			});

			// Building the schema
			var xmlSchema = new Schema(schemaName);
			xmlSchema.setSchemaACL("creator", "creator", "creator");
			xmlSchema.setDefaultACL("creator", "creator", "creator");
			var aclGroup = new SchemaACLGroup("aclG1", "all", "all", schemaFieldArr);
			xmlSchema.addACLGroup(aclGroup);

			var client = new apstrata.apsdb.client.Client();
			var surveyData = null;
			var ss = client.setSchema (
				function() {
					surveyData = self.generateAndDisplayEmbedCodes(data, arrFields, arrTitleFields, xmlSchema.name);
				}, function () {
					var warningMsg = '';
					switch (ss.errorCode) {
						case 'DUPLICATE_SCHEMA_NAME':
							warningMsg = 'Survey already exists! Please change its name';
							break;
						case 'INVALID_SCHEMA_NAME':
							warningMsg = 'The survey title must not contain any special characters! Please change its name';
							break;
						default:
							warningMsg = ss.errorDetail;
					}

					self.warningMessage.style.display = ''; // Display the warning message
					self.warningMessage.innerHTML = warningMsg;
				},
				{
					schema: xmlSchema.toString(),
					schemaName: xmlSchema.name
				});

			return surveyData;
		},

		/**
		 * Excludes the following characters:
		 * ', ,~,!,%
		 * Then truncates the string to the first 10 characters
		 *
		 * @param title The survey title to use for the schema name
		 */
		cleanTitleForSchemaName: function (title) {
			var strTitleForSchema = this.title.value.replace(/ /g, '');
			strTitleForSchema = strTitleForSchema.replace(/'/g, '');
			strTitleForSchema = encodeURIComponent(strTitleForSchema);
			strTitleForSchema = strTitleForSchema.replace(/~/g, '');
			strTitleForSchema = strTitleForSchema.replace(/!/g, '');
			strTitleForSchema = strTitleForSchema.replace(/%/g, '');
			strTitleForSchema = (strTitleForSchema.length > 10) ? strTitleForSchema.substring(0, 10) : strTitleForSchema;

			return strTitleForSchema;
		},

		generateAndDisplayEmbedCodes: function (data, arrFields, arrTitleFields, schemaName) {
			var surveyData = {
				title: this.title.value,
				description: this.description.value,
				viewResults: this.viewResults.checked,
				successMessage: this.successMsg.value,
				questions: data
			};

			var listSurveyData = {
				title: this.title.value,
				fields: arrFields,
				titleFields: arrTitleFields,
				apsdbSchema: schemaName
			};

			var viewUrl = this.getViewUrl();
			/* 
			//console.debug(dojo.toJson(surveyData));
			var generatedCode = '<div>Copy and paste the following embed code in your html page to run the survey.</div><textarea style="width:400px; height:100px;">'
			+ '<!-- You can move the script tag to the head of your html page -->\n'
			+ '<script type="text/javascript" src="../../lib/dojo/1.3.0-src/dojo/dojo.js" djConfig="parseOnLoad: true"></script>\n'
			+ '<script type="text/javascript" src="../../apstrata/apstrata.js" apConfig="key:\'7744293024\', secret:\'3B45DE19C689EDAFCA47\', serviceURL: \'http://apsdb.apstrata.com/sandbox-apsdb/rest\'"></script>'
			+ '<script type="text/javascript" src="widgets/SurveyRunner.js" ></script>\n';
			
			if(this.viewResults.checked)
				generatedCode += '<script type="text/javascript" src="widgets/SurveyChartingLoader.js" ></script>\n';
				
			generatedCode += '<script>var schema = \'' + dojo.toJson(surveyData) + '\';</script>\n'
			+ '<!-- Place this DIV where you want the widget to appear in your page -->\n'
			+ '<div dojoType="surveyWidget.widgets.Survey" /></div>'
			+ '</textarea>';*/

			var surveyDataSchema = encodeURIComponent(dojo.toJson(surveyData)).replace(/'/g, '%27'); // Replace single quotes with their HEX
			this.output.innerHTML = '<div>Copy and paste the following embed code in your html page to run the survey.</div><textarea style="width:400px; height:100px;">'
			+ '<iframe width="400px" height="700px" src=\''+ viewUrl +'/generateEmbed.view?key=7744293024&secret=3B45DE19C689EDAFCA47&serviceURL=http://apsdb.apstrata.com/sandbox-apsdb/rest&schema=' + surveyDataSchema + '\' ></iframe>'
			+ '</textarea>';
			//this.output.innerHTML = generatedCode;
			this.output.style.display = "";
			this.output.width = "800px";

			/*this.listingEmbed.innerHTML = '<div>Copy and paste the following embed code in your html page to see the results of your survey.</div><textarea style="width:400px; height:100px;">'
			+ '<!-- You can move the script tag to the head of your html page -->\n'
			+ '<script type="text/javascript" src="../../lib/dojo/1.3.0-src/dojo/dojo.js" djConfig="parseOnLoad: true"></script>\n'
			+ '<script type="text/javascript" src="../../apstrata/apstrata.js" apConfig="key:\'7744293024\', secret:\'3B45DE19C689EDAFCA47\', serviceURL: \'http://apsdb.apstrata.com/sandbox-apsdb/rest\'"></script>'
			+ '<script type="text/javascript" src="widgets/SurveyListingLoader.js" ></script>\n'
			+ '<script>var schema = \'' + dojo.toJson(listSurveyData) + '\';</script>\n'
			+ '<!-- Place this DIV where you want the widget to appear in your page -->\n'
			+ '<div>'
			+ '<div dojoType="surveyWidget.widgets.SurveyListing" /></div>'
			+ '</div>'
			+ '</textarea>';*/
			var listSurveyDataSchema = encodeURIComponent(dojo.toJson(listSurveyData)).replace(/'/g, '%27'); // Replace single quotes with their HEX
			this.listingEmbed.innerHTML = '<div>Copy and paste the following embed code in your html page to see the results of your survey.</div><textarea style="width:400px; height:100px;">'
			+ '<iframe width="400px" height="700px" src=\''+ viewUrl +'/generateEmbed.view?AF_deliveryChannel=listing&key=7744293024&secret=3B45DE19C689EDAFCA47&serviceURL=http://apsdb.apstrata.com/sandbox-apsdb/rest&schema=' + listSurveyDataSchema + '\' ></iframe>'
			+ '</textarea>';
			this.listingEmbed.style.display = "";
			this.listingEmbed.width = "800px";

			/*this.chartingEmbed.innerHTML = '<div>Copy and paste the following embed code in your html page to see charts of results of your survey.</div><textarea style="width:400px; height:100px;">'
			+ '<!-- You can move the script tag to the head of your html page -->\n'
			+ '<script type="text/javascript" src="../../lib/dojo/1.3.0-src/dojo/dojo.js" djConfig="parseOnLoad: true"></script>\n'
			+ '<script type="text/javascript" src="../../apstrata/apstrata.js" apConfig="key:\'7744293024\', secret:\'3B45DE19C689EDAFCA47\', serviceURL: \'http://apsdb.apstrata.com/sandbox-apsdb/rest\'"></script>'
			+ '<script type="text/javascript" src="widgets/SurveyChartingLoader.js" ></script>\n'
			+ '<script>var schema = \'' + dojo.toJson(surveyData) + '\';</script>\n'
			+ '<!-- Place this DIV where you want the widget to appear in your page -->\n'
			+ '<div>'
			+ '<div dojoType="surveyWidget.widgets.SurveyCharting" /></div>'
			+ '</div>'
			+ '</textarea>';*/
			this.chartingEmbed.innerHTML = '<div>Copy and paste the following embed code in your html page to see charts of results of your survey.</div><textarea style="width:400px; height:100px;">'
			+ '<iframe width="400px" height="700px" src=\''+ viewUrl +'/generateEmbed.view?AF_deliveryChannel=aggregates&key=7744293024&secret=3B45DE19C689EDAFCA47&serviceURL=http://apsdb.apstrata.com/sandbox-apsdb/rest&schema=' + surveyDataSchema + '\' ></iframe>'
			+ '</textarea>';
			this.chartingEmbed.style.display = "";
			this.chartingEmbed.width = "800px";

			return surveyData;
		},

		addslashes: function(str) {
			str=str.replace(/\\/g,'\\\\');
			str=str.replace(/\'/g,'\\\'');
			str=str.replace(/\"/g,'\\"');
			return str;
		},
		
		getViewUrl: function() {
			pathName = window.location.pathname.split("/");
			viewUrl = window.location.protocol + "//" + window.location.host + "/" + pathName[1];
			return viewUrl;
		},
		
		getUrlParam: function(name) {
		  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
		  var regexS = "[\\?&]"+name+"=([^&#]*)";
		  var regex = new RegExp( regexS );
		  var results = regex.exec( window.location.href );
		  if( results == null )
		    return "";
		  else
		    return results[1];
		},
		
		saveSurvey: function() {
			// Assemble the cookie name
			var strTitleForCookie = this.surveyTitle.replace(/ /g, ''); // Remove all spaces from the survey title
			strTitleForCookie = (strTitleForCookie.length > 30) ? strTitleForCookie.substring(0, 30) : strTitleForCookie;
			var cookie = 'apstrata.' + apstrata.apConfig.key + '.' + strTitleForCookie;

			if(this.surveyform.validate()){
				this.successMessage.innerHTML = "Your survey is being processed...";
				var jsonObj = this.surveyform.getValues();
				var survey = this;

				// Change the name of the attribute 'apsdbSchema' to 'apsdb.schema', then delete the 'apsdbSchema' attribute
				jsonObj['apsdb.schema'] = jsonObj.apsdbSchema;
				delete jsonObj.apsdbSchema;

				var client = new apstrata.apsdb.client.Client();
				var sd = client.saveDocument(
					function() {
						dojo.cookie(cookie, 'taken', {expires: 30 * 256}); // Set the cookie to expire after 30 years

						if (dataModel.viewResults){
							//window.location = dataModel.resultsUrl;
							survey.loadAggregatedResults();
						}
						else {
							survey.surveyDiv.style.display = 'none';
							survey.successMessage.innerHTML = dataModel.successMessage;
						}
					}, function() {
						survey.successMessage.innerHTML = sd.errorDetail;
					},
					{
						store: survey.storeName,
						fields: jsonObj
					}
				)

				return true;
			} else{
				this.successMessage.innerHTML = '';
				return false;
			}
		},
		
		loadAggregatedResults: function() {
			var charts = new surveyWidget.widgets.SurveyCharting();
			dojo._destroyElement(this.survey);
			this.aggregatedResults.addChild(charts);
		}
	});
