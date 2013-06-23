var util = require('util')
  , Readable = require('readable-stream').Readable;


module.exports = ReadStream;

util.inherits(ReadStream, Readable);

/**
 * Readable stream which accepts data from WriteStream.
 *
 * @param {Object} options
 * @api private
 */
function ReadStream(options) {
  if (!(this instanceof ReadStream)) {
    return new ReadStream(options);
  }

  Readable.call(this, options);

  this.id = null;
  this.socket = null;
  this._readable = false;
  this.pushBuffer = [];

  this.on('error', this._onerror.bind(this));
}

ReadStream.prototype._read = function(size) {
  var push;

  if (this.pushBuffer.length) {
    // flush buffer and end if it exists.
    while (push = this.pushBuffer.shift()) {
      if (!push()) break;
    }
    return;
  }

  this._readable = true;
  this.socket._read(this.id, size);
};

ReadStream.prototype._write = function(chunk, encoding, callback) {
  var self = this;

  function push() {
    self._readable = false;
    var ret = self.push(chunk || '', encoding);
    callback();
    return ret;
  }

  if (this._readable) {
    push();
  } else {
    this.pushBuffer.push(push);
  }
};

ReadStream.prototype._end = function() {
  if (this.pushBuffer.length) {
    // end after flushing buffer.
    this.pushBuffer.push(this._onend.bind(this));
  } else {
    this._onend();
  }
};

ReadStream.prototype._onend = function() {
  this._readable = false;

  // signal the end of the data.
  return this.push(null);
};

ReadStream.prototype._onerror = function(err) {
  if (!this.socket) return;
  // check if the error came from the corresponding stream.
  if (err.remote) return;

  // notify the error to the corresponding write-stream.
  this.socket._readerror(this.id, err);
};
