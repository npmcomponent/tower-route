
/**
 * Module dependencies.
 */

var pathToRegexp = require('path-to-regexp')
  , container = require('tower-container')
  , Emitter = require('emitter-component')
  , proto = require('./proto')
  , statics = require('./static');

/**
 * Expose `route`.
 */

module.exports = route;

/**
 * Examples:
 *
 *    route('/posts', 'posts.index')
 *    route('/posts', 'posts.index', 'GET')
 *    route('/posts', 'posts.index', { method: 'GET' })
 *    route('/posts', { name: 'posts.index', method: 'GET' })
 *    route({ path: '/posts', name: 'posts.index', method: 'GET' })
 *    route('posts.index')
 */

function route(name, path, options) {
  if (arguments.length == 1) {
    var factory = container.factory('route:' + name);
    if (factory) return factory.fn;
  }

  return createRoute(name, path, options);
}

function createRoute(name, path, options) {
  options || (options = {});

  if ('/' == name.charAt(0)) {
    options.name = path;
    options.path = name;
  } else {
    options.name = name;
    options.path = path;
  }

  var method = options.method || 'GET'
    , keys = []
    , regexp = pathToRegexp(options.path, keys, options.sensitive, options.strict);

  /**
   * Instantiate a new `Route`.
   */

  function Route(context) {
    this.container = context;
  }

  Emitter(route.prototype);

  Route.prototype = {};
  Route.prototype.Route = Route;
  Route.events = [];
  Route.formats = {};
  Route.params = {};
  Route.validators = [];
  Route.accepts = [];
  Route.middlewares = [];
  Route.id = options.name;
  Route.path = options.path;
  Route.method = method;
  Route.regexp = regexp;
  Route.keys = keys;
  Route.controllerName = Route.id;

  for (var key in statics) Route[key] = statics[key];

  // prototype

  for (var key in proto) Route.prototype[key] = proto[key];

  // XXX: need to keep track of order of routes.
  container.factory('route:' + options.name, Route);

  return Route;
}