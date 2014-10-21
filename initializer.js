/*
 * REthink Initializer *
 */

//require dependencies
var Class = require('../superjs/core/base'),
  fs = require('fs');


module.exports = Class.extend({

  //initialize the database engine
  _init: function (app) {

    //load thinky
    app.thinky = require('thinky');

    //establish connections
    this._connect(app);

    //load models
    this._loadModels(app);

  },

  _connect: function(app) {

    var connections = app.config.data.connections;

    //TODO: loop through models to find only used connections to prevent unnecessary connections

    //loop through connections
    for( var connectName in connections ) {

      console.log('creating connection for: ',connectName);

      //establish rethink connection
      app.connections[connectName] = app.thinky(connections[connectName]);
    }
  },

  //load models by going through module folders
  _loadModels: function(app) {

    console.log('loading models...');

    //maintain quick list of loaded models for console
    var loadedModels = [];

    //check if files are stored in modules or by type
    if( fs.existsSync(app.appPath+'/modules') ) {

      //get list of modules
      var modules = fs.readdirSync(app.appPath+'/modules');

      //load each controller
      modules.map(function(moduleName) {

        //make sure the controller exists
        if( fs.existsSync(app.appPath+'/modules/'+moduleName+'/model.js') ) {

          var model = require(app.appPath+'/modules/'+moduleName+'/model');

          if( model ) {
            app.models[model.name] = app.connections[model.connection].createModel(model.name, model.attributes, model);
            app.models[model.name].config = model;
            loadedModels.push(model.name);
          }
        }

      });

    } else if( fs.existsSync(app.appPath+'/models') ) {

      //get list of models
      var models = fs.readdirSync(app.appPath+'/models');

      //load each controller
      models.map(function(modelName) {

        modelName = modelName.split('.')[0];

        var model = require(app.appPath+'/models/'+modelName);

        if( model ) {
          app.models[model.name] = app.connections[model.connection].createModel(model.name, model.attributes, model);
          app.models[model.name].config = model;
          loadedModels.push(model.name);
        }

      });

    }

    console.log('models loaded:',loadedModels);

  }

});