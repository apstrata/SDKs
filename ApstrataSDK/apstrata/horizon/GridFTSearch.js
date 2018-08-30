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
		for(item of this.advancedSearchOpt.basicColumns){
			data[item.code]=this.frmSearchBasic.get('value')[item.code];
		}
		this.search(data)
		var query = this.query;
		query.set("value","");
	},
	search: function(attr) {}
});
