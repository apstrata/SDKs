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

dojo.provide("apstrata.devConsole.QueryPanel")
dojo.provide("apstrata.devConsole.QueryResultsPanel")

dojo.require("dijit.form.Form");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dojo.data.ItemFileReadStore");

dojo.require('apstrata.ItemApsdbReadStore')
dojo.require('apstrata.widgets.QueryWidget')

dojo.require("apstrata.devConsole.DocumentsSavePanel")

dojo.declare("apstrata.devConsole.QueryResultsPanel", 
[dijit._Widget, dojox.dtl._Templated, apstrata.horizon._HStackableMixin], 
{
	widgetsInTemplate: true,	
	templatePath: dojo.moduleUrl("apstrata.devConsole", "templates/QueryResultsPanel.html"),
		
	constructor: function(attrs) {
		this.attrs = attrs
	},
	
	postCreate: function() {
		var self = this

		dojo.style(this.domNode, {
			width: "800px"
		})
		
		this.grid = new apstrata.widgets.QueryWidget(this.attrs.query);
		dojo.place(this.grid.domNode, this.dvGrid, "first")		
		//dojo.place(this.grid.domNode, this.dvAggregatePage, "first")		
		//dojo.place(this.grid.domNode, this.dvAggregateGlobal, "first")		

		this.inherited(arguments)
	},
	
	destroy: function() {
		if (this.grid) this.grid.destroy()
	}
})

dojo.declare("apstrata.devConsole.QueryPanel", 
[dijit._Widget, dojox.dtl._Templated, apstrata.horizon._HStackableMixin], 
{
	widgetsInTemplate: true,
	templatePath: dojo.moduleUrl("apstrata.devConsole", "templates/QueryPanel.html"),

	constructor: function(attrs) {
		this._target = attrs.target
	},

	postCreate: function() {
		var self = this
		this.userListFetched = false
		
		dojo.connect(self.fldRunAs, 'onClick', function () {
			if (self.userListFetched) return
			self.container.client.call({
				action: "ListUsers",
				request: {
					apsdb: {
						query: ""
					}
				},			
				load: function(operation) {
					self.data = []
					self.userListFetched = true
					dojo.forEach(operation.response.result.users, function(user) {
						self.data.push({name: user['login'], label: user['login'], abbreviation: user['login']})
					})
					
					self.userList = {identifier:'abbreviation',label: 'name',items: self.data}
		        	self.fldRunAs.store = new dojo.data.ItemFileReadStore({ data: self.userList });
				},
				error: function(operation) {
				}
			})
	    });	

		this.inherited(arguments)
	},
	
	_query: function(event, toPage) {
			var self = this
			if (this.queryForm.validate()) {
				var queryString = this.txtQuery.getValue()
				
				var columnsString = self.fldFields.getValue()
				var aggregatesString = self.fldAggregates.getValue()
				var sortingString = self.fldSorting.getValue()
				var FTSString = self.fldFts.getValue()
				var runAs = self.fldRunAs.getValue()
				var aggPageScope = (self.fldAggPScope.getValue()=="aggregatePage")?"true":"false"
				var aggGlobalScope = (self.fldAggGScope.getValue()=="aggregateGlobal")?"true":"false"
				var deniedFields = self.fldDeniedFields.getValue()			
				
				var store = new apstrata.ItemApsdbReadStore({
					client: self.container.client,
					resultsPerPage: 10,
					apsdbStoreName: self.target,
					fields: columnsString,
					label: "name"
				})
				
				var attrs = {
					store: store,
					query: queryString,
					aggregates: aggregatesString,
					sort: sortingString,
					ftsQuery: FTSString,
					columns: columnsString,
					page: ((toPage != null)? toPage : 1),
					forceCount: ((toPage != null)? true : false),
					editAction: self._onEditAction,
					deleteAction: self._onDeleteAction,
					gridRef: self,
					theRowId: "key",
					runAs: runAs
				}
				
				if(aggregatesString != ""){
					attrs.aggregatePage = aggPageScope
					attrs.aggregateGlobal = aggGlobalScope
				}
				if(runAs != ""){
					attrs.deniedFields = deniedFields
				}
				
				self.closePanel()
				self.openPanel(apstrata.devConsole.QueryResultsPanel, {
					query: attrs
				})
			}
	},
	
	_onEditAction: function(docKey, refContainer, gridRefContainer) {
		refContainer.container.client.call({
			action: "ListSchemas",
			request: {
				apsdb: {}
			},
			load: function(operation) {
				refContainer.openPanel(apstrata.devConsole.DocumentsSavePanel, {target: refContainer.target, docKey: docKey, listSchemas: operation.response.result.schemas, currentPage: gridRefContainer.page});
			},
			error: function(operation) {
			}
		});
	},
	
	_onDeleteAction: function (docKey, refContainer, gridRefContainer) {
			dialog3 = new apstrata.widgets.Alert({width: 300, 
													height: 270, 
													actions: "yes,no", 
													message: "<p>Are you sure you want to delete the document with key equals to "+docKey+" ?</p>", 
													clazz: "rounded-sml Alert", 
													iconSrc: apstrata.baseUrl + "/resources/images/pencil-icons/alert.png", 
													modal: true })

			dialog3.show();
			dojo.connect(dialog3, "buttonPressed", function(label) {
				if (label == 'yes') {
					refContainer.container.client.call({
						action: "DeleteDocument",
						request: {
							apsdb: {documentKey : docKey, store : refContainer.target}
						},			
						load: function(operation) {
							if (gridRefContainer != null) {
								gridRefContainer._refresh(true);
							}
						},
						error: function(operation) {
						}
					})
				} else {
					//no(origin)
				}
				dialog3.hide();
			})
		},	
	
})