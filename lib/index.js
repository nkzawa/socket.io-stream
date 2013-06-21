var Socket = require('./socket')
  , WriteStream = require('./write-stream');


exports = module.exports = lookup;

/**
 * Expose Socket constructor.
 *
 * @api public
 */
exports.Socket = Socket;

/**
 * Look up an existing Socket.
 *
 * @param {socket.io#Socket} socket.io
 * @return {Socket} Socket instance
 * @api public
 */
function lookup(sio) {
  if (!sio._streamSocket) {
    sio._streamSocket = new Socket(sio);
  }
  return sio._streamSocket;
}

/**
 * Creates a new writable stream.
 *
 * @param {Object} options
 * @return {WriteStream} writable stream
 * @api public
 */
exports.createStream = function(options) {
  return new WriteStream(options);
};
