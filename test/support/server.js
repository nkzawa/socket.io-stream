var fs = require('fs');
var util = require('util');
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
    file.pipe(checksum).pipe(stream).on('finish', function() {
      callback(checksum.digest());
    });
  });

  ss(socket).on('checksum', function(stream, callback) {
    var checksum = new Checksum();
    stream.pipe(checksum).on('finish', function() {
      callback(checksum.digest());
    }).resume();
  });

  ss(socket).on('echo', function() {
    var args = Array.prototype.slice.call(arguments);
    var s = ss(socket);
    s.emit.apply(s, ['echo'].concat(echo(args)));
  });

  ss(socket).on('sendBack', function() {
    var args = Array.prototype.slice.call(arguments);
    sendBack(args);
  });

  ss(socket).on('multi', function(stream1, stream2) {
    stream1.pipe(stream2);
  });

  ss(socket).on('ack', function() {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();
    callback.apply(this, echo(args));
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

function echo(v) {
  if (v instanceof ss.IOStream) {
    return v.pipe(ss.createStream(v.options));
  }

  if (util.isArray(v)) {
    v = v.map(function(v) {
      return echo(v);
    });
  } else if (v && 'object' == typeof v) {
    for (var k in v) {
      if (v.hasOwnProperty(k)) {
        v[k] = echo(v[k]);
      }
    }
  }
  return v;
}

function sendBack(v) {
  if (v instanceof ss.IOStream) {
    return v.pipe(v);
  }

  if (util.isArray(v)) {
    v.forEach(sendBack);
  } else if (v && 'object' == typeof v) {
    for (var k in v) {
      if (v.hasOwnProperty(k)) {
        sendBack(v[k]);
      }
    }
  }
}
