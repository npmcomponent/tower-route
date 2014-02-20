*This repository is a mirror of the [component](http://component.io) module [tower/route](http://github.com/tower/route). It has been modified to work with NPM+Browserify. You can install it using the command `npm install npmcomponent/tower-route`. Please do not open issues or send pull requests against this repo. If you have issues with this repo, report it to [npmcomponent](https://github.com/airportyh/npmcomponent).*
# Tower Route

Tiny route component for client and server.

## Installation

node.js:

```bash
$ npm install tower-route
```

browser:

```bash
$ component install tower/route
```

## Example

```js
var route = require('tower-route');

route('/welcome', function(context, next){
  context.render({ title: 'Hello World' });
});
```

Or with the `action` method:

```js
route('/welcome')
  .action(function(context, next){
    context.render({ title: 'Hello World' });
  });
```

You can also name them (makes it so you don't have to mess with url strings in code, to redirect/transition/etc.:

```js
route('new-customer', '/welcome');
```

## License

MIT