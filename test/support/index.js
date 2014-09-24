if ('undefined' != typeof require) {
  var io = require('socket.io-client');
  var ss = require('../../');
}

;(function(exports) {

if (io.version) {
  ss.forceBase64 = true;

  // 0.9.x
  exports.client = function(path, options) {
    path = path || '';
    options = options || {};

    var _options = {
      'force new connection': true,
      'auto connect': false,
      'reconnect': false
    };

    for (var key in options) {
      _options[key] = options[key];
    }

    return io.connect(path, _options);
  };

} else {
  // 1.x.x

  exports.client = function(path, options) {
    path = path || '';
    options = options || {};

    var _options = {
      forceNew: true,
      autoConnect: false,
      reconnection: false
    };
    for (var key in options) {
      _options[key] = options[key];
    }

    return io(path, _options);
  };
}

})('undefined' == typeof exports ? this.support = {} : exports);
