var fs = require('fs');
var io = require('socket.io');
var Checksum = require('./checksum');
var crypto = require('crypto');
var ss = require('../../');
var support = require('./');

var server;
if (io.version) {
  // 0.9.x
  ss.forceBase64 = true;
  server = io.listen(support.port, { 'log level': 1 });
} else {
  // 1.x.x
  server = io(support.port);
}

server.on('connection', function(socket) {

  ss(socket).on('read', function(stream, path, callback) {
    var file = fs.createReadStream(__dirname + '/../../' + path);
    var checksum = new Checksum();
    file.pipe(checksum).pipe(stream).on('end', function() {
      callback(checksum.digest());
    });
  });

  ss(socket).on('checksum', function(stream, callback) {
    var checksum = new Checksum();
    stream.pipe(checksum).on('end', function() {
      callback(checksum.digest());
    }).resume();
  });

  ss(socket).on('echo', function(stream) {
    var args = Array.prototype.slice.call(arguments);
    var _stream = args[0] = ss.createStream();
    var s = ss(socket);
    s.emit.apply(s, ['echo'].concat(args));
    stream.pipe(_stream);
  });

  ss(socket).on('sendBack', { allowHalfOpen: true }, function(stream) {
    stream.pipe(stream);
  });

  ss(socket).on('multi', function(stream1, stream2) {
    stream1.pipe(stream2);
  });

  ss(socket).on('clientError', function(stream, callback) {
    stream.on('error', function(err) {
      callback(err.message);
    });
  });

  ss(socket).on('serverError', function(stream, msg) {
    stream.emit('error', new Error(msg));
  });
});
