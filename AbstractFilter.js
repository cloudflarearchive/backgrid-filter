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
     AbstractFilter is a search form widget whose subclasses filter the current collection.
     @class Backgrid.Extension.AbstractFilter
  */
  Backgrid.Extension.AbstractFilter = Backbone.View.extend({
      /** @property */
      tagName: "form",

      /** @property */
      className: "backgrid-filter form-search",

      /** @property {function(Object, ?Object=): string} template */
      template: _.template('<div class="input-prepend input-append"><span class="add-on"><i class="icon-search"></i></span><input class="searchbox" type="text" <% if (placeholder) { %> placeholder="<%- placeholder %>" <% } %> name="<%- name %>" /><span class="add-on"><a class="close" href="#">&times;</a></span></div>'),

      /** @property */
      events: {
          "click .close": "handleClickClear",
          "submit": "handleSubmit"
      },

      /**
       @property [wait=149] The time in milliseconds to wait since for since the
       last change to the search box's value before searching. This value can be
       adjusted depending on how often the search box is used and how large the
       search index is.
       */
      wait: 149,

      /** @property {string} [name='q'] Query key */
      name: "q",

      /**
       @property {string} [placeholder] The HTML5 placeholder to appear beneath
       the search box.
       */
      placeholder: null,

      /**
       Debounces the #search and #clear methods.

       @param {Object} options
       @param {Backbone.Collection} options.collection
       @param {string} [options.name]
       @param {string} [options.placeholder]
       @param {string} [options.wait=149]
       */
      initialize: function (options) {
          Backgrid.requireOptions(options, ["collection"]);
          Backbone.View.prototype.initialize.apply(this, arguments);
          this.wait = options.wait || this.wait;
          this.name = options.name || this.name;
          this.placeholder = options.placeholder || this.placeholder;

          // These methods should always be debounced
      },

      searchBox: function () {
          return this.$el.find("input.searchbox");
      },
      setQuery: function(newValue) {
          this.searchBox().val(newValue);
      },
      clearQuery: function() {
          this.searchBox().val(null);
      },
      getQuery: function() {
          return this.searchBox().val();
      },

      handleSubmit: function (e) {
          e.preventDefault();
          this.search();
      },

      handleClickClear: function (e) {
          e.preventDefault();
          this.clear();
      },

      /**
       Renders a search form with a text box, optionally with a placeholder and
       a preset value if supplied during initialization.
       */
      render: function () {
          this.$el.empty().append(this.template({
              name: this.name,
              placeholder: this.placeholder,
              value: this.value
          }));
          this.delegateEvents();
          return this;
      },

      _debounceMethods: function (methodNames) {
          if (_.isString(methodNames)) methodNames = [methodNames];

          this.undelegateEvents();

          var methodName, method;
          for (var i = 0, l = methodNames.length; i < l; i++) {
              methodName = methodNames[i];
              method = this[methodName];
              this[methodName] = _.debounce(method, this.wait);
          }

          this.delegateEvents();
      },

      /**
       * Apply this filter.
       * @abstract
       */
      search: function() {
          throw new Error('must be implemented by subclass!');
      },

      /**
       * Un-apply this filter.
       * @abstract
       */
      clear: function() {
          throw new Error('must be implemented by subclass!');
      }
  });
}));
