# Socket.IO stream
[![Build Status](https://travis-ci.org/nkzawa/socket.io-stream.png?branch=master)](https://travis-ci.org/nkzawa/socket.io-stream)
[![NPM version](https://badge.fury.io/js/socket.io-stream.png)](http://badge.fury.io/js/socket.io-stream)

Bidirectional binary data transfer with Stream 2 API through [Socket.IO](https://github.com/LearnBoost/socket.io).

## Installation
    $ npm install socket.io-stream

## Usage
To receive streams, you just wrap `socket` with `socket.io-stream`, then listen any events as usual.

Server:
```js
var io = require('socket.io').listen(80);
var ss = require('socket.io-stream');
var path = require('path');

io.of('/user').on('connection', function(socket) {
  ss(socket).on('profile-image', function(stream, data) {
    var filename = path.basename(data.name);
    stream.pipe(fs.createWriteStream(filename));
  });
});
```

`createStream()` will creare a new writable stream which can be sent by `emit`.

Client:
```js
var io = require('socket.io-client');
var ss = require('socket.io-stream');

var socket = io.connect('http://example.com/user');
var stream = ss.createStream();
var filename = 'profile.jpg';

ss(socket).emit('profile-image', stream, {name: filename});
fs.createReadStream(filename).pipe(stream);
```

### Browser
This module can be used on the browser. To do so, just copy the file to a public directory.

    $ cp node_modules/socket.io-stream/socket.io-stream.js somewhere/public/

You can also use [browserify](http://github.com/substack/node-browserify) to build this library manually.

    $ npm install browserify -g
    $ cd node_modules/socket.io-stream
    $ browserify index.js -s ss > socket.io-stream.js

Browser:
```html
<input id="file" type="file" />

<script src="/socket.io/socket.io.js"></script>
<script src="/js/socket.io-stream.js"></script>
<script src="/js/jquery.js"></script>
<script>
$(function() {
  var socket = io.connect('/foo');

  $('#file').change(function(e) {
    var file = e.target.files[0];
    var stream = ss.createStream();

    // upload a file to the server.
    ss(socket).emit('file', stream, {size: file.size});
    ss.createBlobReadStream(file).pipe(stream);
  });
});
</script>
```

## License

MIT
