
/**
 * Module dependencies.
 */

var container = require('tower-container')
  , Route = require('./route')
  , Context = require('./context');

/**
 * Expose `route`.
 */

module.exports = route;

route.Route = Route;
route.Context = Context;

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
    return container.get('route:' + name);
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

  var route = new Route(options);

  // XXX: need to keep track of order of routes.
  container.set('route:' + route.id, route);

  return route;
}