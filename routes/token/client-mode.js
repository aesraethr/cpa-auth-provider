"use strict";

var db              = require('../../models');
var generate        = require('../../lib/generate');
var sendAccessToken = require('./send-token');

var async = require('async');

var clientModeSchema = {
  id: "/token/client_credentials",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    grant_type: {
      type:     "string",
      required: true
    },
    client_id: {
      type:     "string",
      required: true
    },
    client_secret: {
      type:     "string",
      required: true
    },
    domain: {
      type:     "string",
      required: true
    }
  }
};

var validateClientModeJson = require('../../lib/validate-json').middleware(clientModeSchema);

module.exports = function(req, res, next) {
  validateClientModeJson(req, res, function(err) {
    if (err) {
      next(err);
      return;
    }

    var clientId     = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var domainName   = req.body.domain;

    var findClient = function(callback) {
      db.Client.find({
            where: { id: clientId, secret: clientSecret, registration_type: 'dynamic' },
            include: [ db.User ]
          })
          .then(function (client) {
            if (!client) {
              res.sendInvalidClient("Unknown client: " + clientId);
              return;
            }
            callback(null, client);
          })
          .catch(function (err) {
            callback(err);
          });
    };

    var findDomain = function(client, callback) {
      db.Domain.find({ where: { name: domainName }})
        .then(function (domain) {
          if (!domain) {
            // SPEC : define correct error message
            res.sendInvalidRequest("Unknown domain: " + domainName);
            return;
          }

          callback(null, client, domain);
        }).catch(function(err) {
          callback(err);
        });
    };

    /**
     * Delete any existing access token for the given client at the
     * given domain.
     */

    var deleteAccessToken = function(client, domain, callback) {
      db.sequelize.query(
        "DELETE FROM AccessTokens WHERE client_id=? AND domain_id=?",
        { replacements: [ client.id, domain.id ] })
      .then(function() {
        callback(null, client, domain);
      },
      function(err) {
        callback(err);
      });
    };

    var createAccessToken = function(client, domain, callback) {
      // TODO: Handle duplicated tokens
      db.AccessToken
        .create({
          token:     generate.accessToken(),
          user_id:   client.user_id,
          client_id: client.id,
          domain_id: domain.id
        })
        .then(function(accessToken) {
          callback(null, client, domain, accessToken);
        })
        .catch(function(err) {
          callback(err);
        });
    };

    async.waterfall([
      findClient,
      findDomain,
      deleteAccessToken,
      createAccessToken
    ], function(err, client, domain, accessToken) {
      if (err) {
        next(err);
        return;
      }

      sendAccessToken(res, accessToken, domain, client.user);
    });
  });
};
