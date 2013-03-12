
/**
 * Module dependencies.
 */

var Emitter = require('emitter-component')
  , pathToRegexp = require('path-to-regexp')
  , slice = [].slice
  , context;

/**
 * Expose `Route`.
 */

module.exports = Route;

/**
 * Instantiate a new `Route`.
 */

function Route(options) {
  this.id = options.name;
  this.path = options.path;
  this.method = options.method || 'GET';
  this.regexp = pathToRegexp(
      options.path
    , this.keys = []
    , options.sensitive
    , options.strict);

  this.events = [];
  this.formats = {};
  this.params = {};
  this.validators = [];
  this.accepts = [];
  this.middlewares = [];
  this.controllerName = this.id;
}

/**
 * Make the `Route` instance an event emitter.
 */

Emitter(Route.prototype);

/**
 * Specify how to parse a URL parameter.
 *
 * This is roughly equivalent to an attribute
 * on a model, e.g. `model('Post').attr(x)`.
 *
 * @api public
 */

Route.prototype.param = function(name, options){
  options || (options = {})
  options.validators || (options.validators = {});
  this.params[name] = context = options;
  return this;
}

/**
 * Validations to apply either to the route
 * or to a specific param.
 *
 * Can pass a function or a string followed
 * by multiple arguments. If a string is passed,
 * it will use one of the globally defined validators.
 *
 * @api public
 */

Route.prototype.validate = function(){
  context.validators.push(slice.call(arguments));
  return this;
}

/**
 * The default controller used for this route.
 *
 * If not defined, it defaults to a controller
 * named after the route. If that controller
 * doesn't exist, it will be created (lazily).
 *
 * @param {String} name
 * @api public
 */

Route.prototype.controller = function(name){
  this.controllerName = name;
  return this;
}

/**
 * Function to process the incoming request.
 *
 * If called multiple times they will be executed
 * in sequence. They can be asynchronous, just
 * pass a `done` argument to `fn`.
 *
 * @param {Function} fn
 * @api public
 */

Route.prototype.use = function(fn){
  this.middlewares.push(fn);
  return this;
}

/**
 * Accepted `Content-Type`s.
 *
 * If not specified, it will accept any.
 * 
 * @param {String|Arguments} arguments
 * @api public
 */

Route.prototype.accept = function(){
  slice.call(arguments).forEach(function(type){
    this.accepts.push(type);
  }, this);

  return this;
}

/**
 * Event handlers which will be used on the `Context`.
 *
 * @param {String} name
 * @param {Function} fn Any number of functions, which
 *    will be called in sequence on this event.
 * @api public
 */

Route.prototype.on = function() {
  this.events.push(slice.call(arguments));
  return this;
}

/**
 * Specify how to format the data for the response.
 *
 * Example:
 *
 *    route('/', 'index')
 *      .format('json', function(){
 *        this.render({ hello: 'world' });
 *      })
 *
 * @param {String} format
 * @param {Function} fn
 * @api public
 */

Route.prototype.format = function(format, fn) {
  this.formats[format] = fn;
  return this;
}

/**
 * XXX: TODO
 */

Route.prototype.resource = function(name){

}

/**
 * XXX: TODO
 */

Route.prototype.resources = function(name){

}

/**
 * Clear the chainable API context.
 */

Route.prototype.self = function(){
  context = undefined;
  return this;
}

/**
 * Check if this route matches `path`, if so
 * populate `params`.
 *
 * @param {String} path
 * @param {Array} params
 * @return {Boolean}
 * @api private
 */

Route.prototype.match = function(path, params){
  var keys = this.keys
    , qsIndex = path.indexOf('?')
    , pathname = ~qsIndex ? path.slice(0, qsIndex) : path
    , m = this.regexp.exec(pathname);

  if (!m) return false;

  for (var i = 1, len = m.length; i < len; ++i) {
    var key = keys[i - 1];

    var val = 'string' == typeof m[i]
      ? decodeURIComponent(m[i])
      : m[i];

    if (key) {
      params[key.name] = undefined !== params[key.name]
        ? params[key.name]
        : val;
    } else {
      params.push(val);
    }
  }

  return true;
};