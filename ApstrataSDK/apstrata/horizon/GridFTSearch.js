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
	_search: function() {
		this.search({
			search: this.frmSearch.get('value').search
		})
	},
	
	search: function(attr) {}
})
