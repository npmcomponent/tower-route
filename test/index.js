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
  });

  it('should parse params', function(done){
    var params = {
        likes: '10'
      , published: '0'
    };

    var context = { path: '/posts', params: params };

    route('/posts', 'posts.index')
      .param('likes', 'integer')
      .param('published', 'boolean')
      .handle(context, function(){
        assert(10 === params.likes);
        //assert(false === params.published);
        done();
      });
  });

  it('should serialize to format', function(done){
    var context = { path: '/', params: {}, format: 'json' };

    route('/', 'index')
      .format('json', function(context){
        
      })
      .handle(context, function(){
        //assert(false === params.published);
        done();
      });
  });

  //it('should emit when route is defined', function(done){
  //  route.on('define', function(r){
  //    assert('index' == r.id);
  //    route.off('define');
  //    done();
  //  });
  //
  //  route('/', 'index');
  //});
});
