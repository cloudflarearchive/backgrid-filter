/*
  backgrid-filter
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT @license.
*/
(function (factory) {
  // CommonJS
  if (typeof exports == "object") {

    var lunr;

    try {
      lunr = require("lunr");
    }
    catch (err) {}

    module.exports = factory(require("underscore"),
                             require("backbone"),
                             require("backgrid"),
                             lunr);
  }
  // Browser
  else if (typeof _ !== "underscore" &&
           typeof Backbone !== "undefined" &&
           typeof Backgrid !== "undefined") {
    factory(_, Backbone, Backgrid, window.lunr);
  }

}(function (_, Backbone, Backgrid, lunr) {
  "use strict";

  /**
     LunrFilter is a ClientSideFilter that uses [lunrjs](http://lunrjs.com/) to
     index the text fields of each model for a collection, and performs
     full-text searching.

     @class Backgrid.Extension.LunrFilter
     @extends Backgrid.Extension.ClientSideFilter
  */
  Backgrid.Extension.LunrFilter = Backgrid.Extension.ClientSideFilter.extend({

    /**
       @property {string} [ref="id"]｀lunrjs` document reference attribute name.
    */
    ref: "id",

    /**
       @property {Object} fields A hash of `lunrjs` index field names and boost
       value. Unlike Backgrid.Extension.ClientSideFilter#fields, LunrFilter#fields is _required_ to
       initialize the index.
    */
    fields: null,

    /**
       Indexes the underlying collection on construction. The index will refresh
       when the underlying collection is reset. If any model is added, removed
       or if any indexed fields of any models has changed, the index will be
       updated.

       @param {Object} options
       @param {Backbone.Collection} options.collection
       @param {string} [options.ref] ｀lunrjs` document reference attribute name.
       @param {Object} [options.fields] A hash of `lunrjs` index field names and
       boost value.
       @param {number} [options.wait]
    */
    initialize: function (options) {
      Backgrid.Extension.ClientSideFilter.prototype.initialize.apply(this, arguments);

      this.ref = options.ref || this.ref;

      var collection = this.collection = this.collection.fullCollection || this.collection;
      this.listenTo(collection, "add", this.addToIndex);
      this.listenTo(collection, "remove", this.removeFromIndex);
      this.listenTo(collection, "reset", this.resetIndex);
      this.listenTo(collection, "change", this.updateIndex);

      this.resetIndex(collection);
    },

    /**
       Reindex the collection. If `options.reindex` is `false`, this method is a
       no-op.

       @param {Backbone.Collection} collection
       @param {Object} [options]
       @param {boolean} [options.reindex=true]
    */
    resetIndex: function (collection, options) {
      options = _.extend({reindex: true}, options || {});

      if (options.reindex) {
        var self = this;
        this.index = lunr(function () {
          _.each(self.fields, function (boost, fieldName) {
            this.field(fieldName, boost);
            this.ref(self.ref);
          }, this);
        });

        collection.each(function (model) {
          this.addToIndex(model);
        }, this);
      }
    },

    /**
       Adds the given model to the index.

       @param {Backbone.Model} model
    */
    addToIndex: function (model) {
      var index = this.index;
      var doc = model.toJSON();
      if (index.documentStore.has(doc[this.ref])) index.update(doc);
      else index.add(doc);
    },

    /**
       Removes the given model from the index.

       @param {Backbone.Model} model
    */
    removeFromIndex: function (model) {
      var index = this.index;
      var doc = model.toJSON();
      if (index.documentStore.has(doc[this.ref])) index.remove(doc);
    },

    /**
       Updates the index for the given model.

       @param {Backbone.Model} model
    */
    updateIndex: function (model) {
      var changed = model.changedAttributes();
      if (changed && !_.isEmpty(_.intersection(_.keys(this.fields),
                                               _.keys(changed)))) {
        this.index.update(model.toJSON());
      }
    },

    /**
       Takes the query from the search box and performs a full-text search on
       the client-side. The search result is returned by resetting the
       underlying collection to the models after interrogating the index for the
       query answer.
    */
    search: function () {
      var searchResults = this.index.search(this.getQuery());
      var models = [];
      for (var i = 0; i < searchResults.length; i++) {
        var result = searchResults[i];
        models.push(this.shadowCollection.get(result.ref));
      }
      var col = this.collection;
      if (col.pageableCollection) col.pageableCollection.getFirstPage({silent: true});
      col.reset(models, {reindex: false});
    }

  });
}));
