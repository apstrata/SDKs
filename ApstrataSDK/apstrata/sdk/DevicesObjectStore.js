 /*******************************************************************************
 *  Copyright 2011 Apstrata
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

/**
 * apstrata.ObjectStore provides a dojo Store implementation capable of interacting with the apstrata service
 * 
 * @fileOverview
 */
dojo.provide("apstrata.sdk.DevicesObjectStore")

dojo.require("apstrata.sdk.Connection")
dojo.require("apstrata.sdk.Client")
dojo.require("dojo.store.util.QueryResults")
dojo.require("dojo.store.api.Store")
dojo.require("dojo.data.ObjectStore")

dojo.declare("apstrata.sdk.DevicesObjectStore", 
[dojo.store.api.Store], 
{
	
	idProperty: "id",
	
	/**
	 * Instantiates a new instance of ObjectStore
	 * <br>
	 * 
	 * @param {Object} options has
	 */
	constructor: function(options) {
		var self = this
		
		dojo.mixin(this, options);
		this.action = "ListDevices"

		this.client = new apstrata.sdk.Client(self.connection)
	},
	
	query: function(attrs, options) {
		var self = this
		
		var deferred = new dojo.Deferred();

		var apsdb = attrs || {}
		if (this.ftsQuery) apsdb.ftsQuery = this.ftsQuery
		if (this.queryExpression) {
			apsdb.query = this.queryExpression
		}
		if (this.queryFields) apsdb.attributes = this.queryFields
		if (this.resultsPerPage) apsdb.resultsPerPage = this.resultsPerPage
		if (this.runAs) apsdb.runAs = this.runAs
		if (options && options.count) apsdb.resultsPerPage = options.count
		
		if (options && options.sort) {
			var type = 'string'
			
			if (this.fieldTypes && this.fieldTypes[options.sort[0].attribute]) type = this.fieldTypes[options.sort[0].attribute]
			
			if (type.toLowerCase()!= 'geospatial') {
				if (type.toLowerCase()=='string') {
					apsdb.sort = options.sort[0].attribute + " <" + type +":" + (options.sort[0].descending?"ci:DESC":"ci:ASC") + ">"
				} else if (type.toLowerCase() != "derived"){
					apsdb.sort = options.sort[0].attribute + " <" + type +":" + (options.sort[0].descending?"DESC":"ASC") + ">"
				} else {
					apsdb.sort = options.sort[0].attribute + " <" + (options.sort[0].descending?"DESC":"ASC") + ">"
				}
			}
		}
		
		
		if (options && options.start) {
			apsdb.pageNumber = options.start/options.count + 1 	
		} else {
			apsdb.pageNumber = 1
		}
		
		// TODO: this needs to be managed smarter so we don't ask the count on each query
		if (!apsdb.ftsQuery) {
			apsdb.count = true
		}
	
		var queryAttrs = {}

		for (k in apsdb) {
			queryAttrs["apsdb." + k] = apsdb[k]			
		}

		this.client.call(this.action, queryAttrs, null, {method: "get"}).then (
			function(response) {
				//do the page slicing in case it is an fts query, since fts search always returns resultsPerPage as the count. We also do not ask for the count in case it ia an fts query
				if (!apsdb.ftsQuery) {
					response.result.devices.total = response.result.count
				} else {
					if (apsdb.pageNumber > 1) {
						var tmpDocuments = [];
						for (var i = (apsdb.pageNumber - 1) * apsdb.resultsPerPage; i < response.result.devices.length; i++) {
							tmpDocuments.push(response.result.devices[i])
						}
						response.result.devices = tmpDocuments;	
					}
					if (response.result.devices.length == apsdb.resultsPerPage) {
						//in this case there is a possibility that we have more search results, so we add a page
						response.result.devices.total = (apsdb.pageNumber + 1) * apsdb.resultsPerPage
					} else {
						response.result.devices.total = ((apsdb.pageNumber - 1) * apsdb.resultsPerPage) + response.result.devices.length 
					}
				}
				
				//mix derived fields with the regular ones so that their values get populated in the grid
				for(var i = 0 ; i < response.result.devices.length; i++) {
					if (response.result.devices[i]["_derivedFields"]) {
						for(var derivedFieldName in response.result.devices[i]["_derivedFields"]) {
							response.result.devices[i][derivedFieldName] = response.result.devices[i]["_derivedFields"][derivedFieldName];
						}
						
					}
				}
				
				deferred.callback(response.result.devices)
			},
			function(response) {
				deferred.callback(response.metadata)
			}
		)
		
		return this.queryResults(deferred)
	},
	
	getIdentity: function(object) {
		return object[idProperty] + "|" + object[versionProperty] 
	},
	
	get: function(id) {
		var self = this
		var deferred = new dojo.Deferred()
				
		var requestParams = {
			"apsdb.query": "id=\"" + id + "\"", 
			"apsdb.attributes": self.queryFields,
			"apsdb.includeFieldType": true
		}
		
		if (self.runAs) {
			requestParams["apsdb.runAs"] = self.runAs;
		}
		
		this.client.call("ListDevices", requestParams, null, {method: "GET"}).then(function(response) {
			if (response.result.devices.length>0) {
				deferred.resolve(response.result.devices[0])
			} else {
				deferred.reject("NOT_FOUND")
			}
		}, function(response) {
			deferred.reject(response.metadata)
		})
			
		return deferred
	},
	
	put: function(object, options) {
		var self = this
		var o = {"apsdb.update": true}
		if (options) {
			dojo.mixin(o, options);
		}
		if (object && object.domNode) {
			return this.client.call("SaveDevice", o, object.domNode);	
		}else {		
			dojo.mixin(o, object)	
			return this.client.call("SaveDevice", o)
		}
	},

	add: function(object, options) {
		var self = this		
		var o = {};
		if (options) {
			dojo.mixin(o, options);
		}
		if (object && object.domNode) {
			return this.client.call("SaveDevice", o, object.domNode);	
		}else {			
			dojo.mixin(o, object)
			return this.client.call("SaveDevice", o)
		}
	},

	remove: function(id, options) {
		var self = this
		var requestParams = {
			"id": id
		}
		
		if (self.runAs) {
			requestParams["apsdb.runAs"] = self.runAs;
		}
		
		return this.client.call("DeleteDevice", requestParams, null, options)
	},
	
	queryResults: function(results){
		// summary:
		//		A function that wraps the results of a store query with additional
		//		methods.
		//
		// description:
		//		QueryResults is a basic wrapper that allows for array-like iteration
		//		over any kind of returned data from a query.  While the simplest store
		//		will return a plain array of data, other stores may return deferreds or
		//		promises; this wrapper makes sure that *all* results can be treated
		//		the same.
		//
		//		Additional methods include `forEach`, `filter` and `map`.
		//
		// returns: Object
		//		An array-like object that can be used for iterating over.
		//
		// example:
		//		Query a store and iterate over the results.
		//
		//	|	store.query({ prime: true }).forEach(function(item){
		//	|		//	do something
		//	|	});
		
		if(!results){
			return results;
		}
		// if it is a promise it may be frozen
		if(results.then){
			results = dojo.delegate(results);
		}
		function addIterativeMethod(method){
			if(!results[method]){
				results[method] = function(){
					var args = arguments;
					return dojo.when(results, function(results){
						Array.prototype.unshift.call(args, results);
						return dojo.store.util.QueryResults(dojo[method].apply(dojo, args));
					});
				};
			}
		}
		addIterativeMethod("forEach");
		addIterativeMethod("filter");
		addIterativeMethod("map");
		if(!results.total){
			results.total = dojo.when(results, function(results){
				return results.total;
			});
		}
		return results;
	}		
})

