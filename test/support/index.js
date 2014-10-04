var io = require('socket.io-client');
var ss = require('../../');

exports.port = process.env.ZUUL_PORT || 4000;

var isBrowser = !!global.window;
var defaultURI = isBrowser ? '' : 'http://localhost:' + exports.port;

if (io.version) {
  ss.forceBase64 = true;

  var optionMap = {
    autoConnect: 'auto connect',
    forceNew: 'force new connection',
    reconnection: 'reconnect'
  };

  // 0.9.x
  exports.client = function(uri, options) {
    if ('object' === typeof uri) {
      options = uri;
      uri = null;
    }
    uri = uri || defaultURI;
    options = options || {};

    var _options = {
      'force new connection': true
    };

    for (var key in options) {
      _options[optionMap[key] || key] = options[key];
    }

    return io.connect(uri, _options);
  };

} else {
  // 1.x.x

  exports.client = function(uri, options) {
    if ('object' === typeof uri) {
      options = uri;
      uri = null;
    }
    uri = uri || defaultURI;
    options = options || {};

    var _options = {
      forceNew: true
    };
    for (var key in options) {
      _options[key] = options[key];
    }

    return io(uri, _options);
  };
}
