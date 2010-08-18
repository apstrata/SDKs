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

dojo.provide("apstrata.widgets.QueryWidget")

dojo.require("dojox.grid.DataGrid")

dojo.require ("apstrata.widgets.PageNumberSelector")

dojo.declare("apstrata.widgets.QueryWidget", [dijit._Widget, dijit._Templated], {
	widgetsInTemplate: true,
	templateString: "<div style='width: 100%; height: 100%;'><div dojoAttachPoint='dvSearch'></div><div dojoAttachPoint='dvSpinner'></div><div dojoAttachPoint='dvGrid' style='width: 100%; height: 100%;'></div></div>",
	store: null,
	query: "X!=\"Y\"",
	columns: "apsdb.documentKey",
	runAs: "",
	aggregates: "",
	aggregatePage: "",
	aggregateGlobal: "",
	runAs: "",
	deniedFields: "",
	sort: "",
	ftsQuery: "",
	page: 1,
	rows: 10,
	showSearch: false,

	constructor: function(attrs){
		var self = this
		if (attrs.store) this.store = attrs.store
		if (attrs.query) this.query = attrs.query
		if (attrs.page) this.page = attrs.page
		if (attrs.columns) this.columns = attrs.columns
	    if (attrs.runAs) this.runAs = attrs.runAs
	    if (attrs.aggregates) this.aggregates = attrs.aggregates
	    if (attrs.aggregatePage) this.aggregatePage = attrs.aggregatePage
	    if (attrs.aggregateGlobal) this.aggregateGlobal = attrs.aggregateGlobal
	    if (attrs.runAs) this.runAs = attrs.runAs
	    if (attrs.deniedFields) this.deniedFields = attrs.deniedFields
	    if (attrs.sort) this.sort = attrs.sort
	    if (attrs.ftsQuery) this.ftsQuery = attrs.ftsQuery
		if (attrs.layout) {
			this._layout= attrs.layout; 
		} else {
				this._layout = []
		
				// compute layout
				dojo.forEach(self.columns.split(","), function(field) {
					field = dojo.string.trim(field)
					self._layout.push({ field: field, name: field, width: 'auto' })
				})		
			}
		if (attrs.showSearch) this.showSearch = attrs.showSearch
	},
	
	postMixInProperties: function() {
		// Add the search field and button if showSearch was set to true 
		if (this.showSearch) {
			this.templateString = "<div style='width: 100%; height: 100%;'><div dojoAttachPoint='dvSearch' class='searchBox'><input dojoType='dijit.form.TextBox' dojoAttachPoint='searchText' value=''><button dojoType='dijit.form.Button' dojoAttachPoint='btnSearch'>Search</button></div></br><div dojoAttachPoint='dvSpinner'></div><div dojoAttachPoint='dvGrid' style='width: 100%; height: 100%;'></div></div>";
		}
	},
	
	postCreate: function() {
		var self = this

		dojo.connect(self.store, "totalPagesCalculated", function(pages, itemsCount) {
			if (self._spinner == undefined) {
				self._spinner = new apstrata.widgets.PageNumberSelector({min:1, max:pages, value:1, visibleRange: 10, bigStep: 5})
		        self.dvSpinner.appendChild(self._spinner.domNode);
				
				dojo.connect(self._spinner, "onChange", function() {
					self.page = self._spinner.value
					self._refresh()
				})
			}
		})	
		
		// Create the function that will overwrite the sort function of the grid
		var sortFunc = function (e) {
			this._lastScrollTop = this.scrollTop;
			
			var sortingProps = this.getSortProps();
			sortingOrder = (sortingProps[0].descending == true)?"DESC":"ASC";
			self.sort = sortingProps[0].attribute + ":" + sortingOrder;
			
			var query = {
				query: self.query,
				count: (self.page == 1),
				pageNumber: self.page,
		        runAs: self.runAs,
		        aggregates: self.aggregates,
		        aggregatePage: self.aggregatePage,
		        aggregateGlobal: self.aggregateGlobal,
		        sort: self.sort,
		        runAs: self.runAs,
		        deniedFields: self.deniedFields,
		        ftsQuery: self.ftsQuery
			} 
			this.setQuery(query)
			
			this._refresh();
		}
		 
		// create a new grid:
        this._grid = new dojox.grid.DataGrid({
            query: {
				query: self.query,
				count: (self.page == 1),
				pageNumber: self.page,
		        runAs: self.runAs,
		        aggregates: self.aggregates,
		        aggregatePage: self.aggregatePage,
		        aggregateGlobal: self.aggregateGlobal,
		        sort: self.sort,
		        runAs: self.runAs,
		        deniedFields: self.deniedFields,
		        ftsQuery: self.ftsQuery
			}, 
            store: self.store,
            rowSelector: '15px',
			sort: sortFunc,
			autoHeight: true,
            structure: self._layout
        }, document.createElement('div'));
		
        // append the new grid to the div "gridContainer4":
        this.dvGrid.appendChild(this._grid.domNode);
		
		// Add the search field and button if showSearch was set to true 
		if (this.showSearch) {
			dojo.connect(self.btnSearch, "onClick", function(){
				self.ftsQuery = self.searchText.value;
				
				var query = {
					query: self.query,
					count: (self.page == 1),
					pageNumber: self.page,
			        runAs: self.runAs,
			        aggregates: self.aggregates,
			        aggregatePage: self.aggregatePage,
			        aggregateGlobal: self.aggregateGlobal,
			        sort: self.sort,
			        runAs: self.runAs,
			        deniedFields: self.deniedFields,
			        ftsQuery: self.ftsQuery
				} 
				self._grid.setQuery(query)
				self._grid._clearData();
				self._grid._fetch();
			})
		}

        // Call startup, in order to render the grid:
        this._grid.startup();		
	},
	
	destroy: function() {
		if (this._grid) {
			this._grid.destroy()
		}

		if (this._spinner) {
			this._spinner.destroy()
		}		
		
		this.inherited(arguments)
	},
	
	setQuery: function(query) {
		this.query = query
		this._refresh()
	},
	
	setPage: function(page) {
		this.page = page
		this._refresh()
	},
	
	_refresh: function() {
		var self = this
		var query = {
				query: self.query,
				count: (self.page == 1),
				pageNumber: self.page,
		        runAs: self.runAs,
		        aggregates: self.aggregates,
		        aggregatePage: self.aggregatePage,
		        aggregateGlobal: self.aggregateGlobal,
		        sort: self.sort,
		        runAs: self.runAs,
		        deniedFields: self.deniedFields,
		        ftsQuery: self.ftsQuery
			} 
			
		if (this._grid) {
			this._grid.setQuery(query)
			this._grid._refresh()
		}
			
	},
	
	destroy: function() {
		if (this._grid) this._grid.destroy()
		if (this._spinner) this._spinner.destroy()
		
		this.inherited(arguments)
	}
})


