
/**
 * Transition to a new route.
 *
 * @param {String} name   Name of the route.
 * @api public
 */
exports.transition = function(name){
  // XXX
}

/**
 * Redirect to a new route or url.
 */

exports.redirect = function(path, options){
  // XXX
}

exports.render = function(){
  return this.req.render.apply(this.req, arguments);
}

exports.sendFile = function(){

}

/**
 * A controller, scoped to the current 
 * request/response context.
 *
 * @param {String} name
 * @api public.
 */

exports.controller = function(name){
  return this.container.lookup('controller:' + (name || this.Route.controllerName)); // .permission(this.currentUser).use(this.container)
}

/**
 * Current user for the route, set somehwere else.
 */

exports.user;

/**
 * Container scoped to the user/client making the request.
 */

exports.container;

/**
 * Check if this route matches `path`, if so
 * populate `params`.
 *
 * @param {String} path
 * @param {Array} params
 * @return {Boolean}
 * @api private
 */

exports.match = function(path, params){
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