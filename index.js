
/**
 * Module dependencies.
 */

var Emitter = require('tower-emitter')
  , pathToRegexp = require('path-to-regexp')
  //, series = require('part-async-series')
  , slice = [].slice
  , context
  //, view = require('tower-view');

/**
 * Expose `route`.
 */

exports = module.exports = route;

/**
 * Expose `Route`.
 */

exports.Route = Route;

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
  if (typeof name === "object") return;
  if (1 == arguments.length && routes[name])
    return routes[name];

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
 * Add mixin to routes.
 */

exports.use = function(fn){
  mixins.push(fn);
  return exports;
}

/**
 * Remove all routes.
 */

exports.clear = function(){
  mixins.length = 0;
  exports.routes.length = 0;
}

var mixins = [];

/**
 * Routes array.
 */

var routes = exports.routes = [];

/**
 * Mixin `Emitter`.
 */

Emitter(exports);

/**
 * Instantiate a new `Route`.
 */

function Route(options) {
  context = this;

  this.id = this.name = options.name;
  this.path = options.path;
  this.method = options.method || 'GET';
  this.regexp = pathToRegexp(
      options.path
    , this.keys = []
    , options.sensitive
    , options.strict);

  this.formats = {};
  this.params = {};
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

Route.prototype.format = function(format, fn){
  if ('function' == typeof format) {
    this.formats['*'] = format;
  } else {
    this.formats[format] = fn;
    this.accepts.push(format);
  }

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
    , m = (this.regexp instanceof RegExp) ? this.regexp.exec(pathname) : new RegExp(this.regexp).exec(pathname);

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
  context.route = this;

  // TODO: defaults for routes?
  // if (this._enter.length) {
  var self = this;

  try {
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
  } catch (e) {
    //self.emit(500, e);
    // Errors that occurs won't be caught but an error
    // within the `series` method will.
    throw e;
    context.error = e;
    series(self, self.actions['500'], context, function(){})
  }
  
  return true;
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
};

/**
 * XXX: tmp for now.
 * XXX: Implement template caching. This will only cache
 *      the raw html files and hold it in memory.
 *      The bundler will delete any caches of templates
 *      if the files changes.
 * XXX: Automatically call this method if they didn't call
 *      it?
 * XXX: The `name` parameter corresponds to the main view.
 *      Fetch that view NOT the template.
 * Render a specific view.
 * @param  {String} name
 */
Route.prototype.render = function(name) {

  this.format('html', function(context)
  {
    view.context = context;
    view.render(name);
  });

  this.on('request', function(context)
  {
    context.render();
  });

};


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

/**
 * Apply all mixins
 */

route.on('define', function(_route){
  for (var i = 0, n = mixins.length; i < n; i++) {
    mixins[i](_route);
  }
});
