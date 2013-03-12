
/**
 * Module dependencies.
 */

var Container = require('tower-container').Container;

/**
 * Expose `Context`.
 */

module.exports = Context;

/**
 * Instantiate a new `Context`.
 */

function Context(route, container) {
  this.route = route;
  this.container = container || new Container;
}

/**
 * Transition to a new route.
 *
 * @param {String} name   Name of the route.
 * @api public
 */

Context.prototype.transition = function(name){
  // XXX
}

/**
 * Redirect to a new route or url.
 */

Context.prototype.redirect = function(path, options){
  // XXX
}

Context.prototype.render = function(){
  return this.req.render.apply(this.req, arguments);
}

Context.prototype.sendFile = function(){

}

/**
 * A controller, scoped to the current 
 * request/response context.
 *
 * @param {String} name
 * @api public.
 */

Context.prototype.controller = function(name){
  return this.container
    .lookup('controller:' + (name || this.route.controllerName)); // .permission(this.currentUser).use(this.container)
}

/**
 * Current user for the route, set somehwere else.
 */

Context.prototype.user;

/**
 * Container scoped to the user/client making the request.
 */

Context.prototype.container;
