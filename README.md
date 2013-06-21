# Socket.IO-Stream

Bidirectional binary data transfer with Stream 2 API through [Socket.IO](https://github.com/LearnBoost/socket.io).

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
