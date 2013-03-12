
/**
 * Module dependencies.
 */

var pathToRegexp = require('path-to-regexp')
  , container = require('tower-container')
  , Emitter = require('component-emitter')
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
  if (arguments.length == 1)
    return container.factory('route:' + name);

  return createRoute(name, path, options);
}

function createRoute(name, path, options) {
  if ('object' == typeof name)
    options = name;
  else if ('object' == typeof path)
    options = path;

  options || (options = {});

  var method = options.method || 'GET'
    , keys = []
    , regexp = pathtoRegexp(path, keys, sensitive, strict);

  /**
   * Instantiate a new `Route`.
   */

  function route(context) {
    this.path = path;
    this.method = method;
    this.regexp = regexp;
    this.keys = keys;
    this.container = context;
  }

  Emitter(route.prototype);

  route.prototype.route = route;
  route.events = [];
  route.formats = {};
  route.params = {};
  route.validators = [];
  route.accepts = [];
  route.middlewares = [];
  route.controllerName = options.name;

  container.factory('route:' + name, route);

  return Route;
}