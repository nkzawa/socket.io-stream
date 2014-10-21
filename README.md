# Socket.IO stream
[![Build Status](https://travis-ci.org/nkzawa/socket.io-stream.png?branch=master)](https://travis-ci.org/nkzawa/socket.io-stream)
[![NPM version](https://badge.fury.io/js/socket.io-stream.png)](http://badge.fury.io/js/socket.io-stream)

This is the module for bidirectional binary data transfer with Stream 2 API through [Socket.IO](https://github.com/LearnBoost/socket.io).

## Installation
    $ npm install socket.io-stream

## Usage
If you are not familiar with Stream API, be sure to check out [the docs](http://nodejs.org/api/stream.html).
I also recommend checking out the awesome [Stream Handbook](https://github.com/substack/stream-handbook):

For streaming between servers and clients, you must send stream instances first.
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

`createStream()` will return a new stream which can be sent by `emit`.

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

You can stream data from a client to server, and vice versa.

```js
// send data
ss(socket).on('file', function(stream) {
  fs.createReadStream('/path/to/file').pipe(stream);
});

// receive data
ss(socket).emit('file', stream);
stream.pipe(fs.createWriteStream('file.txt'));
```

### Browser
This module can be used on the browser. To do so, just copy a file to a public directory.

    $ cp node_modules/socket.io-stream/socket.io-stream.js somewhere/public/

You can also use [browserify](http://github.com/substack/node-browserify) to build manually.

    $ npm install browserify -g
    $ cd node_modules/socket.io-stream
    $ browserify index.js -s ss > socket.io-stream.js

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

#### Upload progress
You can track upload progress like the following:

```js
var blobStream = ss.createBlobReadStream(file);
var size = 0;

blobStream.on('data', function(chunk) {
  size += chunk.length;
  console.log(Math.floor(size / file.size * 100) + '%');
  // -> e.g. '42%'
});

blobStream.pipe(stream);
```

### Supporting Socket.IO 0.9
You have set `forceBase64` option `true` when using on socket.io v0.9.x.

```js
ss.forceBase64 = true;
```


## Documentation

### ss(sio)
- sio `socket.io Socket` A socket of Socket.IO, both for client and server
- return `Socket`

Look up an existing `Socket` instance based on `sio` (a socket of Socket.IO), or create one if it doesn't exist.

### socket.emit(event, [arg1], [arg2], [...])
- event `String` The event name

Emit an `event` with variable args including at least a stream.

```js
ss(socket).emit('myevent', stream, {name: 'thefilename'}, function() { ... });
// send some streams at a time.
ss(socket).emit('multiple-streams', stream1, stream2);
```

### socket.on(event, [options], listener)
- event `String` The event name
- options `Object` options for received Streams
    - highWaterMark `Number`
    - encoding `String`
    - decodeStrings `Boolean`
    - objectMode `Boolean`
- listener `Function` The event handler function

Add a `listener` for `event`. `listener` will take streams with any data as arguments. `options` is an object for streams.

```js
ss(socket).on('myevent', function(stream, data, callback) { ... });
// with options
ss(socket).on('any', {highWaterMark: 64 * 1024}, function(stream) { ... });
```

### ss.createStream([options])
- options `Object`
    - highWaterMark `Number`
    - encoding `String`
    - decodeStrings `Boolean`
    - objectMode `Boolean`
- return `Duplex Stream`

Create a new duplex stream. See [the docs](http://nodejs.org/api/stream.html) for the details of stream and `options`.

```js
var stream = ss.createStream();
```

### ss.createBlobReadStream(blob, [options])
- options `Object`
    - highWaterMark `Number`
    - encoding `String`
    - objectMode `Boolean`
- return `Readable Stream`

Create a new readable stream for [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) and [File](https://developer.mozilla.org/en-US/docs/Web/API/File) on browser. See [the docs](http://nodejs.org/api/stream.html) for the details of stream and `options`.

```js
var stream = ss.createBlobReadStream(new Blob([1, 2, 3]));
```

## License

MIT
