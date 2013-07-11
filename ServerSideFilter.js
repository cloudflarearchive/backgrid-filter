/*
  backgrid-filter
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT @license.
*/
(function (factory) {
  // CommonJS
  if (typeof exports == "object") {
    module.exports = factory(require("underscore"),
                             require("backbone"),
                             require("backgrid"));
  }
  // Browser
  else if (typeof _ !== "underscore" &&
           typeof Backbone !== "undefined" &&
           typeof Backgrid !== "undefined") {
    factory(_, Backbone, Backgrid);
  }

}(function (_, Backbone, Backgrid) {
  "use strict";

  /**
     ServerSideFilter is a search form widget that submits a query to the server
     for filtering the current collection.

     @class Backgrid.Extension.ServerSideFilter
     @extends Backgrid.Extension.AbstractFilter
  */
  Backgrid.Extension.ServerSideFilter = Backgrid.Extension.AbstractFilter.extend({
    initialize: function(options) {
        Backgrid.Extension.AbstractFilter.prototype.initialize.apply(this, arguments);

        // Persist the query on pagination
        var collection = this.collection, self = this;
        if (Backbone.PageableCollection &&
            collection instanceof Backbone.PageableCollection &&
            collection.mode == "server") {
            collection.queryParams[this.name] = function () {
                return self.getQuery() || null;
            };
        }
    },

    /**
     Upon search form submission, this event handler constructs a query
     parameter object and pass it to Collection#fetch for server-side
     filtering.
    */
    search: function () {
      var data = {};

      // go back to the first page on search
      var collection = this.collection;
      if (Backbone.PageableCollection &&
          collection instanceof Backbone.PageableCollection &&
          collection.mode == "server") {
        collection.state.currentPage = 1;
      }
      else {
        var query = this.getQuery();
        if (query) data[this.name] = query;
      }

      collection.fetch({data: data, reset: true});
    },

    clear: function () {
      this.clearQuery();
      this.collection.fetch({reset: true});
    }
  });

}));
