var route = require('..')
  , Context = route.Context
  , container = require('tower-container')
  , assert = require('chai').assert;

describe('serverTest', function() {
  beforeEach(function(){
    //container.clear();
  });

  it('should define', function() {
    route('/', 'index')
    route('posts.index', '/posts')
    // route('posts.create', '/posts', 'GET');
    route('posts.create', '/posts', { method: 'POST' });
    
    var i = route('index');

    assert.equal('/', i.path);
    assert.equal('index', i.id);
    assert.equal(/^\/\/?$/i.toString(), i.regexp.toString());
    assert.equal('GET', i.method);
    assert.equal(0, i.keys.length);

    var i = route('posts.index');

    assert.equal('/posts', i.path);
    assert.equal('posts.index', i.id);
    assert.equal(/^\/posts\/?$/i.toString(), i.regexp.toString());
    assert.equal('GET', i.method);
    assert.equal(0, i.keys.length);

    var i = route('posts.create');

    assert.equal('/posts', i.path);
    assert.equal('posts.create', i.id);
    assert.equal(/^\/posts\/?$/i.toString(), i.regexp.toString());
    assert.equal('POST', i.method);
    assert.equal(0, i.keys.length);
  })

  it('should allow dynamic path segments', function(){
    route('/:username', 'users.show')

    var i = route('users.show');

    assert.equal(/^\/(?:([^\/]+?))\/?$/i.toString(), i.regexp.toString());
    assert.equal(1, i.keys.length);
    assert.deepEqual([ { name: 'username', optional: false } ], i.keys);
  })

  it('should allow specifying the accepted content types', function(){
    route('/:username', 'users.show')
      .accept('json', 'html');

    assert.deepEqual(['json', 'html'], route('users.show').accepts);
  })

  it('should allow specifying event handlers', function(){
    var connect = function(){}

    route('/:username', 'users.show')
      .on('connect', connect);

    var i = route('users.show');

    assert.equal(1, i.events.length);
    assert.deepEqual([['connect', connect]], i.events);
  })
});
