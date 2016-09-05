'use strict';

var db            = require('../../models');
var authHelper    = require('../../lib/auth-helper');
var logger        = require('../../lib/logger');
var requestHelper = require('../../lib/request-helper');
var generate      = require('../../lib/generate');

module.exports = function(router) {
  router.get('/admin', authHelper.authenticateFirst, function(req, res) {
    res.render('./admin/index.ejs');
  });

  router.get('/admin/domains', authHelper.authenticateFirst, function(req, res) {
    db.Domain.findAll()
      .catch(function(err, domains) {

          res.send(500);
          return;
        }).then(function(){

        res.render('./admin/domains.ejs', { domains: domains });
      });
  });

  router.get('/admin/domains/add', authHelper.authenticateFirst, function(req, res) {
    res.render('./admin/add_domain.ejs');
  });

  router.post('/admin/domains', authHelper.ensureAuthenticated, function(req, res, next) {
    var domain = {
      name:         req.body.name,
      display_name: req.body.display_name,
      access_token: generate.accessToken()
    };

    db.Domain.create(domain)
      .catch(function(err, domain) {

          // TODO: Report validation errors to the user.
          res.render('./admin/add_domain.ejs');
          return;
        }).then(function(){

        requestHelper.redirect(res, '/admin/domains');
      });
  });
};
