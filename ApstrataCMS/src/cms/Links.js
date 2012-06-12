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
	filterable: true,
	sortable: true,
	editable: true,
	multiEditMode: false,

	newObjectPanel: null,
	
	pageFormDefinition:  {
		label: "Link",
		fieldset: [
//			{name: "apsdb.documentKey", label: "Page ID", required: true, type: "string"},
			{name: "title", type: "string", required: true},
			{name: "address", type: "string", required: true},
			{name: "description", type: "string", required: false},
			{name: "target", label: "type", type: "string"},
			{name: "documentType", type: "hidden", value: "link"}			
		],
		actions: ['save']
	},

	
	// index of the essential item properties
	idAttribute: 'apsdb.documentKey',
	labelAttribute: 'title',
	
	constructor: function() {
		var self = this

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
		dojo.addClass(this.domNode, "pagesList")
		this.inherited(arguments)
	},

	openEditor: function(value) {
		var self = this	

		this.openPanel(apstrata.horizon.WrapperPanel, {
			widgetClass: "apstrata.ui.forms.FormGenerator",
			maximizable: true,
			cssClass: "pageEditor",
			attrs: {
				definition: self.pageFormDefinition,
				save: function(v) {
					v["apsdb.ftsFields"] = "name,address"

					delete v["apsdb!documentKey"]
					if (v.dijit) delete v.dijit

					self.store.add(v).then(function() {
						self.reload()
					})
				},
				value: value 
			}
		})
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
	}
})


