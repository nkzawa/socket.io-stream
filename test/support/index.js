if ('undefined' != typeof require) {
  var io = require('socket.io-client');
}

;(function(exports) {

if (io.version) {
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

    return io.connect('http://localhost' + path, _options);
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

    return io('http://localhost' + path, _options);
  };
}

})('undefined' == typeof exports ? this.support = {} : exports);
