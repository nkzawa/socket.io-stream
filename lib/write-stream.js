var util = require('util')
  , Writable = require('readable-stream').Writable;


module.exports = WriteStream;

util.inherits(WriteStream, Writable);

/**
 * Writable stream which sends data to ReadStream.
 *
 * @param {Object} options
 * @api private
 */
function WriteStream(options) {
  if (!(this instanceof WriteStream)) {
    return new WriteStream(options);
  }

  Writable.call(this, options);

  this.id = null;
  this.socket = null;
  this._writable = false;
  this.writeBuffer = [];

  this.once('finish', this._onfinish.bind(this));
  this.on('error', this._onerror.bind(this));
}

WriteStream.prototype._write = function(chunk, encoding, callback) {
  var self = this;

  function write() {
    self._writable = false;
    self.socket._write(self.id, chunk, encoding, callback);
  }

  if (this._writable) {
    write();
  } else {
    this.writeBuffer.push(write);
  }
};

WriteStream.prototype._read = function(size) {
  var write = this.writeBuffer.shift();
  if (write) return write();

  this._writable = true;
};

WriteStream.prototype._onfinish = function() {
  this.socket._end(this.id);
};

WriteStream.prototype._onerror = function(err) {
  if (!this.socket) return;
  // check if the error came from the corresponding stream.
  if (err.remote) return;

  // notify the error to the corresponding read-stream.
  this.socket._writeerror(this.id, err);
};

