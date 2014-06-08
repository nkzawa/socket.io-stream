var http = require('http');
var server = require('socket.io');
var io = require('socket.io-client');
var port = 8888;


if (server.version) {
  // 0.9.x

  exports.client = function(path, options) {
    path = path || '';
    options = options || {};

    var _options = {
      'force new connection': true,
      'reconnect': false
    };
    for (var key in options) {
      _options[key] = options[key];
    }

    return io.connect('http://localhost:' + port + path, _options);
  };

  exports.startServer = function(context, done) {
    context.io = server.listen(port, {'log level': 1}, done);
  };

  exports.stopServer = function(context, done) {
    var sockets = context.io.sockets.sockets;
    for (var sid in sockets) {
      if (sockets.hasOwnProperty(sid)) {
        sockets[sid].disconnect();
      }
    }
    context.io.server.close(done);
  };

} else {
  // 1.0.x

  exports.client = function(path, options) {
    path = path || '';
    options = options || {};

    var _options = {
      forceNew: true,
      reconnection: false
    };
    for (var key in options) {
      _options[key] = options[key];
    }

    return io('http://localhost:' + port + path, _options);
  };

  exports.startServer = function(context, done) {
    context.server = http.Server();
    context.io = server(context.server);
    context.server.listen(port, done);
  };

  exports.stopServer = function(context, done) {
    context.io.sockets.sockets.slice().forEach(function(socket) {
      socket.disconnect(true);
    });
    context.server.close(done);
  };
}
