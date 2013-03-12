
/**
 * Module dependencies.
 */

var slice = [].slice
  , context;

/**
 * Specify how to parse a URL parameter.
 *
 * This is roughly equivalent to an attribute
 * on a model, e.g. `model('Post').attr(x)`.
 *
 * @api public
 */

exports.param = function(name, options){
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

exports.validate = function(){
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

exports.controller = function(name){
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

exports.use = function(fn){
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

exports.accept = function(){
  slice.call(arguments).forEach(function(type){
    this.accepts.push(type);
  }, this);

  return this;
}

/**
 * Event handlers which will be used on the `Context`.
 *
 * @param {String} name
 * @param {Function} fn
 * @api public
 */

exports.on = function(name, fn) {
  this.events.push([name, fn]);
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

exports.format = function(format, fn) {
  this.formats[format] = fn;
  return this;
}

exports.resource = function(name){

}

exports.resources = function(name){

}

/**
 * Clear the chainable API context.
 */

exports.self = function(){
  context = undefined;
  return this;
}