
/**
 * Module dependencies.
 */

var Emitter = require('tower-emitter');
var pathToRegexp = require('path-to-regexp');
var param = require('tower-param');
var series = require('part-async-series');

/**
 * Expose `route`.
 */

exports = module.exports = route;

/**
 * Expose `Route`.
 */

exports.Route = Route;

/**
 * Expose `collection`.
 */

exports.collection = [];

/**
 * Mixins array.
 */
 
var mixins = [];

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
 * @param {String} name Route name.
 * @param {String} path Route path delimited with periods `.`.
 * @param {Object} options Route options.
 * @return {Route} Route instance.
 * @api public
 */

function route(name, path, options) {
  if (1 === arguments.length && exports.collection[name])
    return exports.collection[name];

  options || (options = {});

  var fn;

  if ('/' === name.charAt(0)) {
    if ('function' === typeof path)
      fn = path;
    else
      options.name = path;
    options.path = name;
  } else {
    options.name = name;
    options.path = path;
  }

  var obj = new Route(options);
  if (fn) obj.action(fn);
  exports.collection[obj.id] = obj;
  exports.collection.push(obj);
  exports.emit('define', obj);
  return obj;
}

/**
 * Mixin `Emitter`.
 */

Emitter(exports);

/**
 * Add mixin to exports.collection.
 *
 * @chainable
 * @param {Function} fn Function to add to list of mixins.
 * @return {Function} exports The main `route` function.
 * @api public
 */

exports.use = function(fn){
  mixins.push(fn);
  return exports;
};

/**
 * Remove all exports.collection.
 *
 * @api public
 */

exports.clear = function(){
  mixins.length = 0;
  exports.collection.length = 0;
};

/**
 * Class representing a route.
 *
 * @class
 *
 * @param {Object} options Route options.
 * @api public
 */

function Route(options){
  this.context = this;
  this.id = this.name = options.name;
  this.path = options.path;
  this.method = options.method || 'GET';
  this.regexp = pathToRegexp(
    options.path,
    this.keys = [],
    options.sensitive,
    options.strict);

  this.formats = {};
  this.params = [];
  this.accepts = [];
  this.middlewares = [];
  this.validators = [];
  this.actions = {};
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
 * @chainable
 * @param {String} name A param name.
 * @param {String} type A param type.
 * @return {Route}
 * @api public
 */

Route.prototype.param = function(name, type, options){
  // this.context = 
  this.params[name] = param(name, type, options);
  return this;
};

/**
 * Define a validator.
 *
 * @chainable
 * @param {String} key Name of the operator for assertion.
 * @param {Mixed} val
 * @return {Route}
 */

Route.prototype.validate = function(key, val){
  if (this === this.context)
    // key is a function
    this.validator(key, val)
  else
    // param or attr
    this.context.validator(key, val);

  return this;
};

/**
 * Append a validator function to the stack.
 *
 * @chainable
 * @param {Function} fn
 * @return {Route}
 */

Route.prototype.validator = function(fn){
  // XXX: just a function in this case, but could handle more.
  this.validators.push(fn);
  return this;
};

/**
 * The accepted HTTP methods.
 *
 * @chainable
 * @param {Object} type
 * @return {Route}
 * @api public
 */

Route.prototype.type = function(type){
  // maybe it should accept an array?
  this.method = type;
  return this;
};

/**
 * Add a function to process the incoming request.
 *
 * If called multiple times they will be executed
 * in sequence. They can be asynchronous, just
 * pass a `done` argument to `fn`.
 *
 * @chainable
 * @param {Function} fn A function to process the incoming request.
 * @return {Route}
 * @api public
 */

Route.prototype.use = function(fn){
  this.middlewares.push(fn);
  return this;
};

/**
 * Accepted `Content-Type`s.
 *
 * If not specified, it will accept any.
 *
 * @chainable
 * @param {Arguments} arguments The default JavaScript function argument list.
 * @return {Route}
 * @api public
 */

Route.prototype.accept = function(){
  var n = arguments.length
  var accepts = new Array(n);

  for (var i = 0; i < n; i++)
    this.accepts.push(arguments[i]);

  return this;
};

/**
 * Specify how to format the data for the response.
 *
 * Example:
 *
 *    route('/', 'index')
 *      .format('json', function(content){
 *        content.render({ hello: 'world' });
 *      })
 *
 * @chainable
 * @param {String} name The data format name.
 * @param {Function} fn The function to respond to the data format.
 * @return {Route}
 * @api public
 */

Route.prototype.format = function(name, fn){
  if ('function' === typeof name) {
    this.formats['*'] = name;
  } else {
    this.formats[name] = fn;
    this.accepts.push(name);
  }

  return this;
};

Route.prototype.before = function(name, fn){
  if ('function' === typeof name) {
    fn = name;
    name = 'request';
  }
  this._action(name).before.push(fn);
  return this;
};

/**
 * Add an action to the actions list.
 *
 * @chainable
 * @param {String} name Action name.
 * @param {Function} fn Function to handle action.
 * @return {Route}
 * @api public
 */

Route.prototype.action = function(name, fn){
  if ('function' === typeof name) {
    fn = name;
    name = 'request';
  }
  this._action(name).fn = fn;
  return this;
};

Route.prototype.after = function(name, fn){
  if ('function' === typeof name) {
    fn = name;
    name = 'request';
  }
  this._action(name).after.push(fn);
  return this;
};

/**
 * Define a param as a "constraint".
 *
 * This means the parameter will be parsed into
 * an object ready for a query.
 */

Route.prototype.constraint = function(left, operators){
  // XXX
  return this;
};

/**
 * Clear the chainable API context.
 *
 * @chainable
 * @return {Route}
 * @api public
 */

Route.prototype.self = function(){
  context = this;
  return this;
};

/**
 * Check if this route matches `path`, if so
 * populate `params`.
 *
 * @param {String} path A path.
 * @param {Array} params Array of param objects.
 * @return {Boolean} true if this route matches `path`, else false.
 * @api private
 */

Route.prototype.match = function(path, params){
  var keys = this.keys;
  var qsIndex = path.indexOf('?');
  var pathname = ~qsIndex ? path.slice(0, qsIndex) : path;
  var m = this.regexp instanceof RegExp
    ? this.regexp.exec(pathname)
    : new RegExp(this.regexp).exec(pathname);

  if (!m) return false;

  for (var i = 1, n = m.length; i < n; ++i) {
    var key = keys[i - 1];

    var val = 'string' == typeof m[i]
      ? decodeURIComponent(m[i])
      : m[i];

    if (key) {
      params[key.name] = params.hasOwnProperty(key.name) && undefined !== params[key.name]
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
 * @param {Context} context A context.
 * @param {Function} next Function used to handle non-matching context path and params.
 * @return {Boolean} true if a request can be processed, else falsy.
 * @api public
 */

Route.prototype.handle = function(context, next){
  if (!this.match(context.path, context.params))
    return next();

  if (context.req)
    context.params = context.req.query;

  var self = this;

  context.event || (context.event = 'request');
  context.route = this;

  var actions = self.actions[context.event];
  var fns = self.middlewares.concat(
    [self.parseParams, self._validate],
    actions.before,
    [actions.fn],
    //  self.formats['*'] ? [self.formats['*']] : []
    actions.after
  );

  try {
    // req.accepted[0].subtype
    // req.ip
    // http://expressjs.com/api.html
    // req.xhr
    // req.subdomains
    // req.acceptedLanguages for tower-inflector
    // XXX: handle multiple formats.
    series(fns, context, next, self);
  } catch (e) {
    context.error = e;
    series(self.actions['500'], context, function(){}, self)
  }
  
  return true;
};

/**
 * Parse the params from a given context.
 *
 * @param {Context} context A context.
 * @api public
 */

Route.prototype.parseParams = function(context, fn){
  var params = this.params;
  var keys = [];
  for (var key in params) keys.push(key);

  var i = 0;

  function next() {
    var key = keys[i++];
    if (!key) return fn();

    if (context.params.hasOwnProperty(key)) {
      params[key].typecast(context.params[key], function(err, val){
        context.params[key] = val;
        next();
      });
    } else {
      next();
    }
  }

  next();
};

Route.prototype._validate = function(context){
  for (var i = 0, n = this.validators.length; i < n; i++) {
    if (false === this.validators[i](context)) {
      throw new Error('Invalid route');
    }
  }
};

/**
 * Get action object for route.
 *
 * @param {String} name A route name.
 * @api private
 */

Route.prototype._action = function(name){
  return this.actions[name] ||
    (this.actions[name] = { before: [], after: [] });
};

/**
 * Apply all mixins.
 */

exports.on('define', function(route){
  for (var i = 0, n = mixins.length; i < n; i++) {
    mixins[i](route);
  }
});