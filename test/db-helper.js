"use strict";

var db = require('../models');

var async = require('async');

module.exports = {
  clearDatabase: function(done) {
    var tables = [
      'AccessTokens',
      'AuthorizationCodes',
      'Clients',
      'Domains',
      'IdentityProviders',
      'PairingCodes',
      'Users'
    ];

    var deleteData = function(table, done) {
      db.sequelize.query("DELETE from " + table).then(function(results) {
        done();
      }).catch(function (err) {
        done(err);
      });
    };

    async.eachSeries(tables, deleteData, done);
  },

  resetDatabase: function(populateDatabase, done) {
    this.clearDatabase(function(error) {
      if (error) {
        console.log(error);
        done(error);
      }
      else {
        populateDatabase(function(error) {
          done(error);
        });
      }
    });
  }
};

