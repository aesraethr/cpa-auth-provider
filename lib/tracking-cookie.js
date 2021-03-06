/**
 * Created by kraxd on 13.10.16.
 */
"use strict";

var generate = require('./generate');
var jwt = require('jwt-simple');
var db = require('../models');
var config = require('../config');
var logger = require('./logger');

var cfg = config.trackingCookie || {};

var enabled = !!cfg.enabled;
// secret for jwt
var JWT_SECRET = cfg.secret || 'secret';
// name of the cookie
var COOKIE_NAME = cfg.name || 'TrackingId';
// cookie age/expiration time -default to 10 years
var COOKIE_AGE = cfg.duration || 10 * 356 * 24 * 60 * 60 * 1000;

module.exports = {
	middleware: trackingCookieMiddleware,
};


function trackingCookieMiddleware(req, res, next) {
	if (!enabled) {
		return next();
	}

	if (!isCorrect(req.cookies[COOKIE_NAME])) {
		createNewUser(function (err, user) {
			if (err) {
				logger.warn(err);
			}
			var expirationDate = new Date(Date.now() + COOKIE_AGE);
			var content = jwt.encode(user, JWT_SECRET);
			res.cookie(COOKIE_NAME, content, {expires: expirationDate});
			next();
		});
	} else {
		next();
	}
}

function createNewUser(done) {
	var tracking_uid = generate.deviceCode();
	db.User.findOrCreate({tracking_uid: tracking_uid}).then(
		function(user) {
			if (user) {
				done(null, tracking_uid);
			} else {
				done(new Error('Failed to get user from database.'), tracking_uid);
			}
		}
	).catch(
		function(err) {
			done(err, tracking_uid);
		}
	);
}

// check if a cookie is of correct origin
function isCorrect(cookie) {
	if (!cookie) {
		return false;
	}
	try {
		var content = jwt.decode(cookie, JWT_SECRET);
	} catch(e) {
		return false;
	}

	return true;
}