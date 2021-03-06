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

dojo.provide("apstrata.devConsole.ScriptsPanel")
dojo.provide("apstrata.devConsole.ScriptEditorPanel")

dojo.require("dijit.form.Form")
dojo.require("dijit.form.Button")
dojo.require("dijit.form.ValidationTextBox")
dojo.require("dijit.form.Textarea")

dojo.declare("apstrata.devConsole.ScriptsPanel", 
[apstrata.horizon.HStackableList], 
{	
	data: [],
	editable: true,
	filterable: true,
	sortable: true,

	postCreate: function() {
		var self = this

		dojo.publish("/apstrata/documentation/topic", [{
			topic: "apstrata Stores APIs",
			id: "StoresAPI"
		}])
		
		this.reload()

		self.inherited(arguments)
	},

	reload: function() {
		var self = this

		this.container.client.call({
			action: "ListScripts",
			load: function(operation) {
				// Rearrange the result to suite the template
				self.data = []
				var tmp = []				
				dojo.forEach(operation.response.result.scripts, function(script) {
					tmp.push(script['name'])
				})			

				tmp.sort()

				for (var i=0; i<tmp.length; i++) {
					self.data.push({label: tmp[i], iconSrc: ""})
				}

				console.dir(self.data)
	
				// Cause the DTL to rerender with the fresh self.data
				self.render()
	
				dojo.connect(self, 'onClick', function(index, label) {
					self.openPanel(apstrata.devConsole.ScriptEditorPanel, {target: label})
				})
			},
			error: function(operation) {
			}
		})
	},

	newItem: function() {
		var self = this

		self.openPanel(apstrata.devConsole.ScriptEditorPanel)
		
		this.inherited(arguments)
	},

	onDeleteItem: function(index, label){
		var self = this
		
		this.container.client.call({
			action: "DeleteScript",
			request: {
				apsdb: {
					scriptName: label
				}
			},
			load: function(operation){
				self.reload()
			},
			error: function(operation){
			}
		})
	},
})

dojo.declare("apstrata.devConsole.ScriptEditorPanel", 
[dijit._Widget, dojox.dtl._Templated, apstrata.horizon._HStackableMixin], 
{
	widgetsInTemplate: true,	
	templatePath: dojo.moduleUrl("apstrata.devConsole", "templates/ScriptEditorPanel.html"),
	maximizePanel: true,
	
	constructor: function(attrs) {
		if (attrs.target) this.scriptName = attrs.target; else this.scriptName= ""
		if (attrs && attrs.target) this.update = true; else this.update = false
	},
	
	postCreate: function() {
		var self = this
		
		if (self.scriptName) {
			this.container.client.call({
				action: "GetScript",
				request: {
					apsdb: {
						scriptName: self.scriptName
					}
				},
				load: function(operation) {
					self.fldName.attr("value", self.scriptName)
					self.txtScript.attr("value", operation.response.result)
					
					self._initCodeEditor()
				},
				error: function(operation) {
				}
			})
		} else {
			self.fldName.attr("value", "")
			self.txtScript.attr("value", "")
			self.btnRun.setDisabled(true);
			
			// TODO: find a more elegant solution, initializing CodeEditor is giving an error, 
			//  unless some delay is provided
			setTimeout(dojo.hitch(this,'_initCodeEditor'), 500)	
		}
		
		this.inherited(arguments)
	},
	
	_initCodeEditor: function() {
		var self = this
		editAreaLoader.init({
			id: self.txtScript.id// "txtEditor"	// id of the textarea to transform		
			,start_highlight: true	// if start with highlight
			,allow_resize: "both"
			,allow_toggle: false
			,word_wrap: true
			,language: "en"
			,syntax: "js"	
		});
	},
	
	_save: function() {
		var self = this

		var apsdb = {
			script: editAreaLoader.getValue(self.txtScript.id),
			update: self.update
		};

		// Make sure that the script name is updated if it has changed.
		if (self.update) {
			if (self.scriptName != self.fldName.value) {
				apsdb.scriptName = self.scriptName;
				apsdb.newScriptName = self.fldName.value;
			} else {
				apsdb.scriptName = self.fldName.value;
			}
		} else {
			apsdb.scriptName = self.fldName.value;
		}

		this.container.client.call({
			action: "SaveScript",
			request: {
				apsdb: apsdb
			},
			formNode: self.frmScript.domNode,
			load: function(operation) {
				self.btnRun.setDisabled(false);
				if (self.scriptName != self.fldName.value) {
					self.scriptName = self.fldName.value;
					self.getParent().reload();
				}
				self.update = true;
			},
			error: function(operation) {
			}
		})
	},
	
	_run: function() {
		var self = this

		this.openPanel(apstrata.devConsole.RunScriptPanel, {
			scriptName: self.scriptName
		})
	},
	
	onDeleteItem: function(index, label){
		var self = this
		
		this.container.client.call({
			action: "DeleteScript",
			request: {
				apsdb: {
					scriptName: label
				}
			},
			load: function(operation){
				self.reload()
			},
			error: function(operation){
			}
		})
	}	
})

dojo.declare("apstrata.devConsole.RunScriptPanel", 
[dijit._Widget, dojox.dtl._Templated, apstrata.horizon._HStackableMixin], 
{	
	widgetsInTemplate: true,
	templatePath: dojo.moduleUrl("apstrata.devConsole", "templates/RunScriptPanel.html"),
	maximizePanel: false,
	
	constructor: function(attrs) {
		console.dir(this)
		if (attrs.scriptName) this.scriptName = attrs.scriptName
	},
	
	_runScript: function() {
		var self = this ;
		var runAs = self.fldRunAs.getValue()
		
		var requestParams = {
			apsdb: {
				scriptName: self.scriptName,
				runAs: runAs
			}
		}
				
		dojo.query('.paramName').forEach(function(node, index, arr){
			var nodeId = dojo.attr(node,"id");
			var nodeValue = dojo.attr(node,"value");
			
			var fieldNode ;
			
			if (self[nodeId].declaredClass == "dojox.form.FileInput")
				fieldNode = self[nodeId].domNode.getElementsByTagName("input")[0];
			else
				fieldNode = self[nodeId].domNode;
			
			if(nodeValue && nodeValue != ""){
				fieldNode.setAttribute("name", nodeValue);
			}else{
				fieldNode.removeAttribute("name");
			}
		})

		self.container.client.call({
			action: "RunScript",
			useHttpMethod: "POST",
			formNode: self.frmParams.domNode,
			request: requestParams,			
			load: function(operation) {
				self.openPanel(apstrata.devConsole.ScriptResultPanel, {
					scriptOutput: operation.response
				})
			},
			error: function(operation) {
				self.openPanel(apstrata.devConsole.ScriptResultPanel, {
				scriptOutput: ""
			})
			}
		})

	},

	postCreate: function() {
		var self = this ;
		this.userListFetched = false ;
		
		dojo.connect(self.fldRunAs, 'onClick', function () {
			if (self.userListFetched) return ;
			self.container.client.call({
				action: "ListUsers",
				request: {
					apsdb: {
						query: ""
					}
				},			
				load: function(operation) {
					var userData = []
					self.userListFetched = true
					dojo.forEach(operation.response.result.users, function(user) {
						userData.push({name: user['login'], label: user['login'], abbreviation: user['login']})
					})
					
					var userList = {identifier:'abbreviation',label: 'name',items: userData}
		        	self.fldRunAs.store = new dojo.data.ItemFileReadStore({ data: userList });
				},
				error: function(operation) {
				}
			})
	    });
		
		this.inherited(arguments)
	},
		
	destroy: function() {
		this.frmParams.destroyDescendants(false);
		this.inherited(arguments);
	}
})

dojo.declare("apstrata.devConsole.ScriptResultPanel", 
[dijit._Widget, dojox.dtl._Templated, apstrata.horizon._HStackableMixin], 
{	
	widgetsInTemplate: true,
	templatePath: dojo.moduleUrl("apstrata.devConsole", "templates/ScriptOutputPanel.html"),
	maximizePanel: false,
	
	constructor: function(attrs) {		
		if (attrs.scriptOutput) this.scriptOutput = attrs.scriptOutput ;
	},
	
	postCreate: function() {
		var self = this ;
		
		self.scriptOutputField.attr("value", JSON.stringify(self.scriptOutput, null, '\t'));	
		this.inherited(arguments)
	}
})