# Tower Route

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

route('/welcome')
  .action(function(context, next){
    context.render({ title: 'Hello World' });
  });
```

## License

MIT