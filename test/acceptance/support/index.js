var http = require('http')
  , server = require('socket.io')
  , io = require('socket.io-client')
  , port = 8888;


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

  exports.startServer = function(done) {
    this.io = server.listen(port, {'log level': 1}, done);
  };

  exports.stopServer = function(done) {
    var sockets = this.io.sockets.sockets;
    for (var sid in sockets) {
      if (sockets.hasOwnProperty(sid)) {
        sockets[sid].disconnect();
      }
    }
    this.io.server.close(done);
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

  exports.startServer = function(done) {
    this.server = http.Server();
    this.io = server(this.server);
    this.server.listen(port, done);
  };

  exports.stopServer = function(done) {
    this.io.sockets.sockets.slice().forEach(function(socket) {
      socket.disconnect(true);
    });
    this.server.close(done);
  };
}
