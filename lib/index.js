var Socket = require('./socket')
  , WriteStream = require('./write-stream')
  , BlobReadStream = require('./blob-read-stream');


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

/**
 * Creates a new readable stream for Blob/File on browser.
 *
 * @param {Blob} blob
 * @param {Object} options
 * @return {BlobReadStream} stream
 * @api public
 */
exports.createBlobReadStream = function(blob, options) {
  return new BlobReadStream(blob, options);
};
