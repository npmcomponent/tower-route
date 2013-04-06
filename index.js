
/**
 * Module dependencies.
 */

var Emitter = 'undefined' == typeof window ? require('emitter-component') : require('emitter')
  , pathToRegexp = require('path-to-regexp')
  , slice = [].slice
  , context;

/**
 * Expose `route`.
 */

module.exports = route;

/**
 * Expose `Route`.
 */

module.exports.Route = Route;

/**
 * Find or define a route.
 *
 * Examples:
 *
 *    route('/posts', 'posts.index')
 *    route('/posts', 'posts.index', 'GET')
 *    route('/posts', 'posts.index', { method: 'GET' })
 *    route('/posts', { name: 'posts.index', method: 'GET' })
 *    route({ path: '/posts', name: 'posts.index', method: 'GET' })
 *    route('posts.index')
 *
 * @param {String} name
 * @param {String} path
 * @param {Object} [options]
 * @api public
 */

function route(name, path, options) {  
  if (1 == arguments.length && routes[name])
    return routes [name];

  options || (options = {});

  if ('/' == name.charAt(0)) {
    options.name = path;
    options.path = name;
  } else {
    options.name = name;
    options.path = path;
  }

  var newRoute = new Route(options);
  routes[newRoute.id] = newRoute;
  routes.push(newRoute);
  route.emit('define', newRoute);
  return newRoute;
}

/**
 * Routes array.
 */

var routes = route.routes = [];

/**
 * Mixin `Emitter`.
 */

Emitter(route);

/**
 * Instantiate a new `Route`.
 */

function Route(options) {
  context = this;

  this.id = options.name;
  this.path = options.path;
  this.method = options.method || 'GET';
  this.regexp = pathToRegexp(
      options.path
    , this.keys = []
    , options.sensitive
    , options.strict);

  this.formats = {};
  this.params = {};
  this.validators = [];
  this.accepts = [];
  this.middlewares = [];
  this.actions = {
      enter: []
    , exit: []
    , request: []
    , connect: []
    , disconnect: []
  };
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
 * The accepted HTTP methods.
 *
 * @param {String} type
 * @api public
 */

Route.prototype.type = function(type){
  // maybe it should accept an array?
  this.method = type;
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
  var n = arguments.length
    , accepts = new Array(n);

  for (var i = 0; i < n; i++)
    this.accepts.push(arguments[i]);

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

Route.prototype.render = function(format, fn){
  if ('function' == typeof format)
    this.formats['*'] = format;
  else
    this.formats[format] = fn;

  return this;
}

Route.prototype.action = function(name){
  var action = this.actions[name] || (this.actions[name] = []);

  for (var i = 1, n = arguments.length; i < n; i++) {
    action.push(arguments[i]);
  }

  return this;
}

/**
 * Clear the chainable API context.
 */

Route.prototype.self = function(){
  context = this;
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

/**
 * Process a request given a context.
 *
 * @param {Context} context
 * @api public
 */

Route.prototype.handle = function(context, next){
  if (!this.match(context.path, context.params)) return next();

  this.parseParams(context);

  context.event || (context.event = 'request');

  // TODO: defaults for routes?
  // if (this._enter.length) {
  var self = this;

  // TODO: this can be optimized by merging it all into one final array.
  series(self, self.middlewares, context, function(){
    series(self, self.actions['enter'], context, function(){
      series(self, self.actions[context.event], context, function(){
        // req.accepted[0].subtype
        // req.ip
        // http://expressjs.com/api.html
        // req.xhr
        // req.subdomains
        // req.acceptedLanguages for tower-inflector
        // TODO: handle multiple formats.
        series(self, self.formats['*'] ? [self.formats['*']] : [], context, next);
      });
    });
  });
};

Route.prototype.on = Route.prototype.action;

Route.prototype.parseParams = function(ctx){
  for (var key in this.params) {
    if (ctx.params.hasOwnProperty(key)) {
      // TODO: serialize params
      // tower typecast
      ctx.params[key] = parseInt(ctx.params[key]);
    }
  }
}

function series(self, callbacks, context, done) {
  if (!callbacks.length) return done();

  var i = 0
    , fn;
 
  function next(err) {
    if (err || context.isCancelled || context.errors) {
      done(err || context.errors);
      return;
    }

    if (fn = callbacks[i++]) {
      if (2 == fn.length) {
        fn.call(self, context, next);
      } else {
        fn.call(self, context);
        next();
      }
    } else {
      done();
    }
  }
 
  next();
}