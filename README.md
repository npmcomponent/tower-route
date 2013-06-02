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