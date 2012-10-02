//This profile is used just to illustrate the layout of a layered build.
//All layers have an implicit dependency on dojo.js.

//Normally you should not specify a layer object for dojo.js. It is normally
//implicitly built containing the dojo "base" functionality (dojo._base).
//However, if you prefer the Dojo 0.4.x build behavior, you can specify a
//"dojo.js" layer to get that behavior. It is shown below, but the normal
//0.9 approach is to *not* specify it.

//

dependencies = {
	layers: [
		{
			name: "apstratacms.js",
			//resourceName: "dijit.dijit",
			dependencies: [
'apstrata.cms.ApConfig',
'apstrata.cms.CMS',
'apstrata.cms.Dashboard',
'apstrata.cms.DocumentEditor',
'apstrata.cms.Home',
'apstrata.cms.HomePageEditor',
'apstrata.cms.Links',
'apstrata.cms.Menu',
'apstrata.cms.MenuEditor',
'apstrata.cms.Pages',
'apstrata.home.ApConfig',
'apstrata.home.CatalogData',
'apstrata.home.dashboard.Accounts',
'apstrata.home.dashboard.Dashboard',
'apstrata.home.dashboard.Menu',
'apstrata.home.dashboard.Profile',
'apstrata.home.Gallery',
'apstrata.home.GalleryItem',
'apstrata.home.GalleryItemViewer',
'apstrata.home.SearchBar',
'apstrata.home.Slides',
'apstrata.horizon.blue.App',
'apstrata.horizon.blue.ApstrataGrid',
'apstrata.horizon.blue.ApstrataGridWithPagination',
'apstrata.horizon.blue.ApstrataHome',
'apstrata.horizon.blue.ApstrataList',
'apstrata.horizon.blue.ApstrataMenu',
'apstrata.horizon.blue.Colors',
'apstrata.horizon.blue.DataList',
'apstrata.horizon.blue.Grid',
'apstrata.horizon.blue.GridWithPagination',
'apstrata.horizon.blue.Home',
'apstrata.horizon.blue.List',
'apstrata.horizon.blue.ListOfDocuments',
'apstrata.horizon.blue.Menu',
'apstrata.horizon.blue.NewList',
'apstrata.horizon.blue.Panel',
'apstrata.horizon.blue.TestData',
'apstrata.horizon.blue.TestPanel',
'apstrata.horizon.Container',
'apstrata.horizon.ControlToolbar',
'apstrata.horizon.Grid',
'apstrata.horizon.GridFTSearch',
'apstrata.horizon.List',
'apstrata.horizon.list.MultipleListContent',
'apstrata.horizon.ListOfDocuments',
'apstrata.horizon.list.SimpleFilterAndSort',
'apstrata.horizon.list.SimpleListContent',
'apstrata.horizon.Login',
'apstrata.horizon.Menu',
'apstrata.horizon.NewList',
'apstrata.horizon.Panel',
'apstrata.horizon.PanelAlert',
'apstrata.horizon.PanelIcons',
//'apstrata.horizon.Preferences',
'apstrata.horizon.util.FilterLabelsByString',
'apstrata.horizon.util.PanelAnimation',
'apstrata.horizon.util._Templated',
'apstrata.horizon.util.TestDataSets',
'apstrata.horizon.WrapperPanel',
'apstrata.sdk.AdminStore',
'apstrata.sdk.ApConfig',
'apstrata.sdk.Client',
'apstrata.sdk.CompactClient',
'apstrata.sdk.Connection',
'apstrata.sdk.ObjectStore',
'apstrata.sdk.Registry',
'apstrata.sdk.TokenConnection',
'apstrata.ui.ApstrataAnimation',
'apstrata.ui.Curtain',
'apstrata.ui.embed.tests.TestWidget',
'apstrata.ui.FlashAlert',
'apstrata.ui.forms.FieldSet',
'apstrata.ui.forms.FormGenerator',
'apstrata.ui.forms.FormGeneratorUtils',
'apstrata.ui.widgets.LoginWidget',
'apstrata.ui.widgets.LoginWidgetPreferences',
'apstrata.ui.widgets.RegistrationWidget',
'dijit.Editor',
'dijit._editor.plugins.FontChoice',
'dijit._editor.plugins.LinkDialog',
'dijit._editor.plugins.TextColor',
'dijit.form.Button',
'dijit.form.CheckBox',
'dijit.form.ComboBox',
'dijit.form.DateTextBox',
'dijit.form.Form',
'dijit.form.HorizontalRuleLabels',
'dijit.form.HorizontalSlider',
'dijit.form.SimpleTextarea',
'dijit.form.TextBox',
'dijit.form.ToggleButton',
'dijit.form.ValidationTextBox',
'dijit.InlineEditBox',
'dijit.layout.BorderContainer',
'dijit.layout.ContentPane',
'dijit.layout._LayoutWidget',
'dijit._Templated',
'dijit.Tooltip',
'dijit.Tree',
'dijit.tree.dndSource',
'dijit.tree.TreeStoreModel',
'doh.runner',
'dojo.cookie',
'dojo.data.ItemFileWriteStore',
'dojo.data.ObjectStore',
'dojo.dnd.Source',
'dojo.fx',
'dojo.fx.easing',
'dojo.io.iframe',
'dojo.io.script',
'dojo.parser',
'dojo.store.api.Store',
'dojo.store.Memory',
'dojo.store.util.QueryResults',
//		'dojox.css3.fx',
'dojox.dtl._base',
'dojox.dtl._Templated',
'dojox.encoding.crypto.SimpleAES',
'dojox.encoding.digests.MD5',
'dojox.form.ListInput',
'dojox.fx.ext-dojo.complex',
'dojox.grid.DataGrid',
'dojox.grid.EnhancedGrid',
'dojox.grid.enhanced.plugins.Pagination',
'dojox.html.ext-dojo.style',
			]
		}
	],

	prefixes: [
		["apstrata", "../../../lib/ApstrataSDK/apstrata"],
		["apstrata.cms", "../../../src/cms"],
		["apstrata.home", "../../../src/home"],
		["apstrata.themes", "../../../themes"]//fake entry to get the css copied
	]
}
