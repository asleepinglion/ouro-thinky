/*
 * Rethink REST Controller *
 * the rest controller class provides basic rest methods to a controller *
 */

//require dependencies
var Controller = require('../superjs/core/controller'),
    _ = require('underscore');

//TODO: deal with joins on all REST methods

module.exports = Controller.extend({

  init: function(app) {

    //call base class constructor
    this._super(app);

    //mark controller as rest enabled
    this.restEnabled = true;

    //store reference to self
    var self = this;

    //store reference to models
    this.models = app.models;

    //associate model of the same name to this controller if it exists
    var modelName = this.name.toLowerCase();
    if( modelName in this.models )
      this.model = this.models[modelName];

  },

  Search: function(req, next) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var where = req.param('where') || req.body.where || {};
    var sort = req.param('sort') || '';
    var limit = req.param('limit') || 25;
    var skip = req.param('skip') || 0;

    //TODO: devise mechanism to translate conditionals into proper rethink filter calls...
    this.app.log.info('searching '+this.name+' where:',where);

    //search database
    this.model.filter(where)
      .limit(limit)
      .skip(skip)
      .orderBy(sort)
      .run()
      .then(function(results) {
        next({success: true, message: "Successfully searched the " + self.name + " database...", results: results});
      }).catch( function(err) {
        next({success: false, message: "Failed to search the " + self.name + " database...", error: err});
      });
  },

  Create: function(req, next) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var obj = req.body || {};

    //add record to the database
    var newDocument = new this._model(obj);
    newDocument.saveAll()
      .then(function(result) {
        next({success: true, message: "Successfully created " + self.name + " record...", results: result});
      })
      .catch(function(err) {
        next({success: false, message: "Failed to create " + self.name + " record...", error: err});
      });

  },

  Update: function(req, next) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var obj = req.body || {};

    if( _.isEmpty(obj) || _.isEmpty(obj.id) ) {
      next({success: false, message: "Failed to update " + self.name + " record...", error: "An id is required to update a record."});
      return;
    }

    //attempt to get the record
    this.model.get(obj.id).run()
      .then(function(model) {

        //merge changes and save
        model.merge(obj).save()
          .then(function(result) {
            next({success: true, message: "Successfully updated " + self.name + " record...", results: result});
          })
          .catch(function(err) {
            next({success: false, message: "Failed to update " + self.name + " record...", error: err});
          });

      })
      .catch(function(err) {
        next({success: false, message: "Failed to update " + self.name + " record...", error: err});
      });
  },

  Delete: function(req, callback) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var obj = req.body || {};

    if(_.isEmpty(obj) || _.isEmpty(obj.id) ) {
      next({success: false, message: "Failed to delete " + self.name + " record...", error: "An id is required to delete the record."});
      return;
    }

    //attempt to get the record
    this.model.get(obj.id).run()
      .then(function(model) {

        //delete record
        model.delete()
          .then(function(result) {
            next({success: true, message: "Successfully deleted " + self.name + " record...", results: result});
          })
          .catch(function(err) {
            next({success: false, message: "Failed to delete " + self.name + " record...", error: err});
          });

      })
      .catch(function(err) {
        next({success: false, message: "Failed to delete " + self.name + " record...", error: err});
      });

  },

  Describe: function(req, next) {

    //TODO: translate attributes to text-based equivalents
    var response = {success: true, model: this.name, attributes: this._model.config.attributes};
    next(response);

  }

});
