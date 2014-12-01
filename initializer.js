/*
 * REthink Initializer *
 */

//require dependencies
var Class = require('../superjs/core/base');
var fs = require('fs');

module.exports = Class.extend({

  //initialize the database engine
  init: function (app) {

    //store reference to the app
    this.app = app;

    //keep track of loaded models for console output
    this.loadedModels = [];

    //load thinky
    app.thinky = require('thinky');

    //establish connections
    this.connect();

    //load models
    this.loadModels();

  },

  //establish thinky connections based on data config
  connect: function() {

    var connections = this.app.config.data.connections;

    //TODO: loop through models to find only used connections to prevent unnecessary connections

    //loop through connections
    for( var connectName in connections ) {

      this.app.log.info('creating connection for:',connectName);

      //establish rethink connection
      this.app.connections[connectName] = this.app.thinky(connections[connectName]);
    }
  },

  //load models by going through module folders
  loadModels: function() {

    this.app.log.info('loading models...');

    //maintain reference to self
    var self = this;

    //check if files are stored in modules or by type
    if( fs.existsSync(this.app.appPath+'/modules') ) {

      //get list of modules
      var modules = fs.readdirSync(this.app.appPath+'/modules');

      //load each controller
      modules.map(function(moduleName) {

        //make sure the controller exists
        if( fs.existsSync(self.app.appPath+'/modules/'+moduleName+'/model.js') ) {

          var model = require(self.app.appPath+'/modules/'+moduleName+'/model');

          if( model ) {
            self.loadModel(moduleName, model);
          }
        }

      });

    } else if( fs.existsSync(this.app.appPath+'/models') ) {

      //get list of models
      var models = fs.readdirSync(this.app.appPath+'/models');

      //load each controller
      models.map(function(modelName) {

        modelName = modelName.split('.')[0];

        var model = require(self.app.appPath+'/models/'+modelName);

        if( model ) {
          self.loadModel(modelName, model);
        }

      });

    }

    this.app.log.info('models loaded:',this.loadedModels);

  },

  //create model with thinky orm
  loadModel: function(modelName, model) {

    //instantiate model
    model = new model();

    //set name if not present
    if( !model.name ) {
      model.name = modelName;
    }

    //convert strings to proper thinky types
    var attributes = this.convertAttributes(model.attributes);

    //create the model
    this.app.models[model.name] = this.app.connections[model.connection].createModel(model.name, attributes, model);

    //store the model on the app
    this.app.models[model.name].config = model;

    //keep track of loaded models for console output
    this.loadedModels.push(model.name);

  },

  //convert attributes from strings to types
  convertAttributes: function(attributes) {

    //loop through attributes
    for( var name in attributes ) {

        //switch on type or default to a pass-thru
        switch( typeof attributes[name].type ) {
          case 'string':
            attributes[name]._type = String;
            break;
          case 'boolean':
            attributes[name]._type = Boolean;
            break;
          case 'number':
            attributes[name]._type = Number;
            break;
          case 'date':
            attributes[name]._type = Date;
            break;
          case 'array':
            attributes[name]._type = Array;
            break;
          default:
            attributes[name]._type = attributes[name].type;
            break;
        }
    }

    return attributes;
  }

});
