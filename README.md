# Socket.IO-Stream
[![Build Status](https://travis-ci.org/nkzawa/socket.io-stream.png?branch=master)](https://travis-ci.org/nkzawa/socket.io-stream)
[![NPM version](https://badge.fury.io/js/socket.io-stream.png)](http://badge.fury.io/js/socket.io-stream)

Bidirectional binary data transfer with Stream 2 API through [Socket.IO](https://github.com/LearnBoost/socket.io).

## Installation
    $ npm install socket.io-stream

## Usage
Server:
```js
var ss = require('socket.io-stream');

io.sockets.on('connection', function(socket) {
  ss(socket).on('foo', function(stream, data) {
    stream.pipe(fs.createWriteStream(data.name));
  });
});
```

Client:
```js
var ss = require('socket.io-stream');
var socket = io.connect('http://localhost');
var stream = ss.createStream();
var filename = 'any.jpg';

ss(socket).emit('foo', stream, {name: filename});
fs.createReadStream(filename).pipe(stream);
```
## License

MIT
