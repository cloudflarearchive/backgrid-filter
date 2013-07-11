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
     ClientSideFilter is a search form widget that searches a collection for
     model matches against a query on the client side. The exact matching
     algorithm can be overriden by subclasses.

     @class Backgrid.Extension.ClientSideFilter
     @extends Backgrid.Extension.AbstractFilter
  */
  Backgrid.Extension.ClientSideFilter = Backgrid.Extension.AbstractFilter.extend({

    /** @property */
    events: _.extend({}, Backgrid.Extension.AbstractFilter.prototype.events, {
      "keydown input.searchbox": "handleKeydownSearchbox",
    }),

    /**
       @property {?Array.<string>} [fields] A list of model field names to
       search for matches. If null, all of the fields will be searched.
    */
    fields: null,

    /**
       Makes a copy of the given collection for searching.

       @param {Object} options
       @param {string} [options.fields]
    */
    initialize: function (options) {
      Backgrid.Extension.AbstractFilter.prototype.initialize.apply(this, arguments);

      this.fields = options.fields || this.fields;
      var collection = this.collection = this.collection.fullCollection || this.collection;
      var shadowCollection = this.shadowCollection = collection.clone();

      this.listenTo(collection, "add", function (model, collection, options) {
        shadowCollection.add(model, options);
      });
      this.listenTo(collection, "remove", function (model, collection, options) {
        shadowCollection.remove(model, options);
      });
      this.listenTo(collection, "sort", function (col) {
        if (!this.getQuery()) shadowCollection.reset(col.models);
      });
      this.listenTo(collection, "reset", function (col, options) {
        options = _.extend({reindex: true}, options || {});
        if (options.reindex && col === collection &&
            options.from == null && options.to == null) {
          shadowCollection.reset(col.models);
        }
      });
      this._debounceMethods(["search", "clear"]);
    },

    handleKeydownSearchbox: function () {
      this.search();
    },

    /**
       Constructs a Javascript regular expression object for #makeMatcher.

       This default implementation takes a query string and returns a Javascript
       RegExp object that matches any of the words contained in the query string
       case-insensitively. Override this method to return a different regular
       expression matcher if this behavior is not desired.

       @param {string} query The search query in the search box.
       @return {RegExp} A RegExp object to match against model #fields.
     */
    makeRegExp: function (query) {
      return new RegExp(query.trim().split(/\W/).join("|"), "i");
    },

    /**
       This default implementation takes a query string and returns a matcher
       function that looks for matches in the model's #fields or all of its
       fields if #fields is null, for any of the words in the query
       case-insensitively using the regular expression object returned from
       #makeRegExp.
   
       Most of time, you'd want to override the regular expression used for
       matching. If so, please refer to the #makeRegExp documentation,
       otherwise, you can override this method to return a custom matching
       function.

       Subclasses overriding this method must take care to conform to the
       signature of the matcher function. The matcher function is a function
       that takes a model as paramter and returns true if the model matches a
       search, or false otherwise.

       In addition, when the matcher function is called, its context will be
       bound to this ClientSideFilter object so it has access to the filter's
       attributes and methods.

       @param {string} query The search query in the search box.
       @return {function(Backbone.Model):boolean} A matching function.
    */
    makeMatcher: function (query) {
      var regexp = this.makeRegExp(query);
      return function (model) {
        var keys = this.fields || model.keys();
        for (var i = 0, l = keys.length; i < l; i++) {
          if (regexp.test(model.get(keys[i]) + "")) return true;
        }
        return false;
      };
    },

    /**
       Takes the query from the search box, constructs a matcher with it and
       loops through collection looking for matches. Reset the given collection
       when all the matches have been found.
    */
    search: function () {
      var matcher = _.bind(this.makeMatcher(this.getQuery()), this);
      var col = this.collection;
      if (col.pageableCollection) col.pageableCollection.getFirstPage({silent: true});
      this.collection.reset(this.shadowCollection.filter(matcher), {reindex: false});
    },

    /**
       Clears the search box and reset the collection to its original.
    */
    clear: function () {
      this.clearQuery();
      this.collection.reset(this.shadowCollection.models, {reindex: false});
    }
  });

}));
