var util = require('util');
var EventEmitter = require("events").EventEmitter;
var request = require('request');
var moment = require('moment');

const BASE_URL = 'https://apiflowerpower.parrot.com';
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss z';

var username;
var password;
var client_id;
var client_secret;
var access_token;
var expires_in;
var refresh_token;

/**
 * Main function
 * @param  {Object} args Object containing username, password, client_id, and client_secret.
 */
var FlowerPower = function(args, callback) {
    EventEmitter.call(this);
    this.authenticate(args, callback);
};

util.inherits(FlowerPower, EventEmitter);

/**
 * Authenticate
 * @param  {Object}   args     Object containing username, password, client_id, and client_secret.
 * @param  {Function} callback Function that will be called once authenticated
 */
FlowerPower.prototype.authenticate = function(args, callback) {
  if(!args) {
    var err = new Error("Authenticate 'args' not set.");
    callback(err);
    return this;
  }

  if(!args.username) {
    var err = new Error("Authenticate 'username' not set.");
    callback(err);
    return this;
  }

  if(!args.password) {
    var err = new Error("Authenticate 'password' not set.");
    callback(err);
    return this;
  }

  if(!args.client_id) {
    var err = new Error("Authenticate 'client_id' not set.");
    callback(err);
    return this;
  }

  if(!args.client_secret) {
    var err = new Error("Authenticate 'client_secret' not set.");
    callback(err);
    return this;
  }

  username = args.username;
  password = args.password;
  client_id = args.client_id;
  client_secret = args.client_secret;

  var form = {
    username: username,
    password: password,
    client_id: client_id,
    client_secret: client_secret,
    grant_type: 'password',
  };

  var url = util.format('%s/user/v1/authenticate', BASE_URL);

  request({
    url: url,
    method: "POST",
    form: form,
  }, function(err, response, body) {
    if (err || response.statusCode != 200) {
      var err = new Error("Authenticate error: " + response.statusCode);
      callback(err);
      return this;
    }

    body = JSON.parse(body);

    access_token = body.access_token;
    expires_in = body.expires_in;
    refresh_token = body.refresh_token;

    this.emit('authenticated');

    if(callback) {
      callback(undefined, body);
      return this;
    }

    return this;
  }.bind(this));

  return this;
};

/**
 * Get garden information
 * @param  {Function} callback Function that will be called once authenticated
 */
FlowerPower.prototype.getGarden = function(callback) {

  // Wait until authenticated.
  if(!access_token) {
    return this.on('authenticated', function() {
      this.getGarden(callback);
    });
  }

  var url = util.format('%s/sensor_data/v2/sync?include_s3_urls=1', BASE_URL);

  var headers = {
    'Authorization': 'Bearer ' + access_token,
  };

  request({
    url: url,
    method: "GET",
    headers: headers,
  }, function(err, response, body) {
    body = JSON.parse(body);

    this.emit('have-garden', err, body.locations, body.sensors);

    if(callback) {
      return callback(err, body.locations, body.sensors);
    }

    return this;

  }.bind(this));

  return this;
};

/**
 * Get samples from a particular plant.
 * @param  {Object}   options  Object containing plant 'id', and optional 'from', 'to' dates.
 * @param  {Function} callback Function that will be called once authenticated
 */
FlowerPower.prototype.getSamples = function(options, callback) {

  // Wait until authenticated.
  if(!access_token) {
    return this.on('authenticated', function() {
      this.getSamples(options, callback);
    });
  }

  if(!options) {
    var err = new Error("getSamples 'options' not set.");
    callback(err);
    return this;
  }

  if(!options.id) {
    var err = new Error("getSamples 'id' not set.");
    callback(err);
    return this;
  }

  if(!options.from && !options.to) {

    // If 'from'/'to' are not set, 'to' is now and 'from' is a day before 'to'.
    options.to = moment();
    options.from = moment(options.to).subtract('days', 1);

  } else if(!options.from && options.to) {

    // If 'to' is set, but no 'from', 'from' is set one day before 'to'.
    options.from = moment(options.to).subtract('days', 1);

  } else if(options.from && !options.to) {

    // If 'from' is set, but no 'to', 'to' is set one day after 'from'.
    options.to = moment(options.from).add('days', 1);

  }

  var from = moment(options.from).utc().format(DATE_FORMAT);
  var to = moment(options.to).utc().format(DATE_FORMAT);

  var url = util.format('%s/sensor_data/v2/sample/location/%s?from_datetime_utc=%s&to_datetime_utc=%s', BASE_URL, options.id, options.from, options.to);

  var headers = {
    'Authorization': 'Bearer ' + access_token,
  };

  request({
    url: url,
    method: "GET",
    headers: headers,
  }, function(err, response, body) {
    body = JSON.parse(body);

    this.emit('have-sample', err, body.samples, body.events, body.fertilizer);

    if(callback) {
      callback(err, body.samples, body.events, body.fertilizer);
      return this;
    }

    return this;
  }.bind(this));

  return this;
};

module.exports = FlowerPower;
