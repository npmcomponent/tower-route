var route = require('..');
var assert = require('assert');

describe('serverTest', function(){
  beforeEach(route.clear);

  it('should define', function(){
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
  });

  it('should allow dynamic path segments', function(){
    route('/:username', 'users.show')

    var i = route('users.show');

    assert(/^\/(?:([^\/]+?))\/?$/i.toString() == i.regexp.toString());
    assert(1 == i.keys.length);
    // assert([ { name: 'username', optional: false } ] == i.keys);
  });

  it('should allow specifying the accepted content types', function(){
    route('/:username', 'users.show')
      .accept('json', 'html');

    assert(['json', 'html'].join(',') == route('users.show').accepts.join(','));
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

  describe('events', function(){
    it('should execute enter -> entered -> exit -> exited', function(done){
      var context = {
          path: '/'
        , params: {}
        , format: 'json'
      };

      route('/', 'index')
        // this happens before a request or web socket connection
        .action('enter', function(context){
          context.enterCalled = true;
          assert(undefined === context.requestCalled);
          // render shouldn't be called first
          assert(undefined === context.renderCalled);
        })
        .action('connect', function(context){

        })
        .action('disconnect', function(context){

        })
        .action('request', function(context){
          context.requestCalled = true;
          assert(undefined === context.renderCalled);
        })
        .action('exit', function(context){
          context.exitCalled = true;
        })
        // you can use render by itself, don't need enter or exit.
        .format(function(){
          context.renderCalled = true;
          // enter should have been called first
          assert(true === context.enterCalled);
        })
        //.render('json', function(context){
        //  context.data
        //})
        .handle(context, function(){
          //assert(false === params.published);
          assert(true === context.enterCalled);
          assert(true === context.requestCalled);
          assert(true === context.renderCalled);
          assert(undefined === context.exitCalled);
          //assert(true === context.entered);
          done();
        });
    });
  });

  describe('format', function(){
    it('should serialize to JSON', function(done){
      var context = {
          path: '/'
        , params: {}
        , format: 'json'
      };

      route('/', 'index')
        .accept('json')
        //.render('json', function(context){
        //  context.data
        //})
        .handle(context, function(){
          //assert(false === params.published);
          done();
        });
    });
  });

  it('should add mixin', function(done){
    var calls = [];

    function renderer(_route) {
      calls.push(_route.path);

      assert('/admin' === calls[0]);
      done();
    }

    route.use(renderer);
    route('/admin', 'admin');
  });

  it('should emit when route is defined', function(done){
   route.on('define', function(r){
     assert('index' == r.id);
     route.off('define');
     done();
   });
  
   route('/', 'index');
  });
});