dojo.provide("apstrata.horizon.GridFTSearch")


dojo.require("dijit.form.Form")
dojo.require("dijit.form.Button");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dojox.dtl.Inline");

dojo.declare("apstrata.horizon.GridFTSearch",
	[dijit._Widget, dojox.dtl._Templated],
	{
		templatePath: dojo.moduleUrl("apstrata.horizon", "templates/GridFTSearch.html"),
		widgetsInTemplate: true,

		titleLabel: "Title:",
		searchActionLabel: "Search",

		constructor: function (args) {
			this.notAdvancedSearch = !args.advancedSearch;
			this.basicMode = (!args.advancedSearchOpt.defaultAdvancedMode) && args.advancedSearch;
			this.advancedMode = (args.advancedSearchOpt.defaultAdvancedMode && args.advancedSearch);
		},
		postCreate: function () {
			this.update();
			var self=this;
			//attach enter pressed event to inputs
			this.query.focusNode.addEventListener("keydown", function (event) {
				if(event.keyCode == 13){
					self._search_advanced();
				}
			
			});
			for( var i = 0 ; i < this.advancedSearchOpt.basicColumns.length; i++){
				var item = this.advancedSearchOpt.basicColumns[i];
				var __input = this[item.code];
				__input.focusNode.addEventListener("keydown", function (event) {
				
					if(event.keyCode == 13){
						self._search_basic();
					}
				
				});
			}

		},

		_search: function () {
			this.search({
				type: "normal",
				search: this.frmSearchNormal.get('value').search
			})
		},
		_search_basic: function () {
			var data = {
				type: "basic"
			};
			for( var i = 0 ; i < this.advancedSearchOpt.basicColumns.length; i++){
				var item = this.advancedSearchOpt.basicColumns[i];
				data[item.code] = this.frmSearchBasic.get('value')[item.code];
			}
			this.search(data)
			var query = this.query;
			query.set("value", "");
		},
		_search_advanced: function () {
			this.search({
				type: "advanced",
				query: this.frmSearchAdvanced.get('value').query
			})
			for( var i = 0 ; i < this.advancedSearchOpt.basicColumns.length; i++){
				var item = this.advancedSearchOpt.basicColumns[i];
				var col1 = this[item.code];
				col1.set("value", "");
			}

		},
		
		enable_advanced: function () {
			this.basicMode = false;
			this.advancedMode = true;
			this.update();
		},
		enable_basic: function () {
			this.basicMode = true;
			this.advancedMode = false;
			this.update();
		},

		search: function (attr) { },
		update: function () {

			dojo.query('[dojoAttachPoint="frmSearchNormalWrapper"]').style("display", (this.notAdvancedSearch ? "block" : "none"))
			dojo.query('[dojoAttachPoint="frmSearchBasicWrapper"]').style("display", this.basicMode ? "block" : "none")
			dojo.query('[dojoAttachPoint="frmSearchAdvancedWrapper"]').style("display", this.advancedMode ? "block" : "none")
		}
	})
