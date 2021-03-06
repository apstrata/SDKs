/**
 * @author rabih
 */
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

dojo.provide("apstrata.devConsole.UsersPanel")
dojo.provide("apstrata.devConsole.UserEditPanel")

dojo.require("apstrata.devConsole.UsersSavePanel")

dojo.require("dijit.form.Form");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dijit.form.DateTextBox");

dojo.declare("apstrata.devConsole.UsersPanel",
[apstrata.horizon.HStackableList],
{
	data: [],
	editable: true,

	reload: function() {
		var self = this

		this.container.client.call({
			action: "ListUsers",
			request: {
				apsdb: {
					query: ""
				}
			},
			load: function(operation) {
				// Rearrange the result to suite the template
				self.data = []
				dojo.forEach(operation.response.result.users, function(user) {
					self.data.push({label: user['login'], iconSrc: ""})
				})

				// Cause the DTL to rerender with the fresh self.data
				self.render()
			},
			error: function(operation) {
			}
		})
	},

	postCreate: function() {
		this.reload()
		this.inherited(arguments)
	},

	onClick: function(index, label) {
		var self = this

		// this.openPanel(apstrata.devConsole.UserEditPanel, {userName: label})
		this.openPanel(apstrata.devConsole.UsersSavePanel, {userName: label})

		this.inherited(arguments)
	},

	onDeleteItem: function(index, label){
		var self = this

		this.container.client.call({
			action: "DeleteUser",
			request: {
				login: label
			},
			load: function(operation){
				self.reload()
			},
			error: function(operation){
			}
		})
	},

	newItem: function() {
		//this.openPanel(apstrata.devConsole.UserEditPanel)
		this.openPanel(apstrata.devConsole.UsersSavePanel)

		this.inherited(arguments)
	}
})

dojo.declare("apstrata.devConsole.UserEditPanel",
[dijit._Widget, dojox.dtl._Templated, apstrata.horizon._HStackableMixin],
{
	widgetsInTemplate: true,
	//templatePath: dojo.moduleUrl("apstrata.devConsole", "templates/UserEditPanel.html"),
	templatePath: dojo.moduleUrl("apstrata.devConsole", "templates/UsersSavePanel.html"),

	constructor: function(attrs) {
		this.userAttributes = {
			user: '',
			password: '',
			password2: '',
			name: '',
			email: '',
			groups: ''
		}

		this.update = false

		if (attrs.userName) {
			this._userName = attrs.userName

			this.update = true
		}
	},

	postCreate: function() {
		var usersPanel = this

		if (this.update) {
			this.container.client.call({
				action: "GetUser",
				request: {
					login: usersPanel._userName
				},
				load: function(operation) {
					usersPanel.userAttributes.user = usersPanel._userName

					for (var prop in operation.response.result.user){
						usersPanel.userAttributes[prop] = operation.response.result.user[prop];
					}

					usersPanel.render()
				},
				error: function(operation) {
				}
			})
		}

		this.inherited(arguments)
	},

	_save: function() {
		var self = this

		if (this.password.value != this.password2.value) {
			alert("passwords don't match")
		}

		var userGroups = (self.groups.value).split(',');
		// trim spaces from the groups list
		for (var group in userGroups){
			if (userGroups.hasOwnProperty (group)){ // make sure we're not playing with anything on the prototype, just with attributes of this object
				userGroups [group] = userGroups[group].replace(/^\s+|\s+$/g,""); // trim leading and trailing spaces from the group name
			}
		}

		this.container.client.call({
			action: "SaveUser",
			request: {
				apsdb: {
					update: self.update
				},
				login: self.user.value,
				password: self.password.value,
				name: self.name.value,
				email: self.email.value,
				groups: userGroups,

			},
			load: function(operation) {
				self.getParent().reload()
			},
			error: function(operation) {
			}
		})
	},

	_openGroups: function() {
		var self = this
		if (this.openWidget) this.openWidget.destroy()

		self.openWidget = new apstrata.admin.GroupsSelectorPanel({parentList: self.panel, container: self.container})

		dojo.connect(self.openWidget, "onChange", function(list) {
			console.dir(list)
			self.groups.value = list
		})

		self.container.addChild(self.openWidget)
	},

	_cancel: function() {
		this.panel.destroy()
	}
})
