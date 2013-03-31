var route = require('..')
  , assert = require('assert')
  , container = require('tower-container');

describe('serverTest', function() {
  beforeEach(function(){
    container.clear();
  });

  it('should define', function() {
    route('/', 'index')
    route('posts.index', '/posts')
    // route('posts.create', '/posts', 'GET');
    route('posts.create', '/posts', { method: 'POST' });
    
    var i = route('index');

    assert('/' == i.path);
    assert('index' == i.id);
    assert(/^\/\/?$/i.toString() == i.regexp.toString());
    assert('GET' == i.method);
    assert(0 == i.keys.length);

    var i = route('posts.index');

    assert('/posts' == i.path);
    assert('posts.index' == i.id);
    assert(/^\/posts\/?$/i.toString() == i.regexp.toString());
    assert('GET' == i.method);
    assert(0 == i.keys.length);

    var i = route('posts.create');

    assert('/posts' == i.path);
    assert('posts.create' == i.id);
    assert(/^\/posts\/?$/i.toString() == i.regexp.toString());
    assert('POST' == i.method);
    assert(0 == i.keys.length);
  })

  it('should allow dynamic path segments', function(){
    route('/:username', 'users.show')

    var i = route('users.show');

    assert(/^\/(?:([^\/]+?))\/?$/i.toString() == i.regexp.toString());
    assert(1 == i.keys.length);
    // assert([ { name: 'username', optional: false } ] == i.keys);
  })

  it('should allow specifying the accepted content types', function(){
    route('/:username', 'users.show')
      .accept('json', 'html');

    assert(['json', 'html'].join(',') == route('users.show').accepts.join(','));
  })

  it('should allow specifying event handlers', function(){
    var connect = function(){}

    route('/:username', 'users.show')
      .on('connect', connect);

    var i = route('users.show');

    assert(1 == i.events.length);
    // assert([['connect', connect]], i.events);
  })

  it('should execute routes', function(done){
    route('/', 'index')
      .use(function(ctx, fn){
        fn();
      })
      .on('error', function(){

      })

    route('posts.index', '/posts')

    get('/', function(){
      console.log('done');
      done();
    });
  });
});

function get(path, done) {
  var i = 0;

  var ctx = { params: {}, path: path };

  function next() {
    if (!route.routes[i])
      return done();

    route.routes[i++](ctx, next);
  }

  next();
}