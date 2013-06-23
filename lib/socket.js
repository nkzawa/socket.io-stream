var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , ReadStream = require('./read-stream')
  , WriteStream = require('./write-stream')
  , debug = require('debug')('socket.io-stream:socket')
  , emit = EventEmitter.prototype.emit
  , slice = Array.prototype.slice;


exports = module.exports = Socket;

/**
 * Base event name for messaging.
 *
 * @api public
 */
exports.event = 'stream';

exports.events = [
  'error'
];

util.inherits(Socket, EventEmitter);

/**
 * Bidirectional stream socket which wraps Socket.IO.
 *
 * @param {socket.io#Socket} socket.io
 * @api public
 */
function Socket(sio) {
  if (!(this instanceof Socket)) {
    return new Socket(sio);
  }

  EventEmitter.call(this);

  this.sio = sio;
  this.ids = 0;
  this.readStreams = {};
  this.writeStreams = {};

  var eventName = exports.event;
  sio.on(eventName, this._onstream.bind(this));
  sio.on(eventName + '-read', this._onread.bind(this));
  sio.on(eventName + '-write', this._onwrite.bind(this));
  sio.on(eventName + '-end', this._onend.bind(this));
  sio.on(eventName + '-writeerror', this._onwriteerror.bind(this));
  sio.on(eventName + '-readerror', this._onreaderror.bind(this));
  sio.on('error', this.emit.bind(this, 'error'));
}

/**
 * Emits streams to this corresponding server/client.
 *
 * @return {Socket} self
 * @api public
 */
Socket.prototype.emit = function(type) {
  if (~exports.events.indexOf(type)) {
    return emit.apply(this, arguments);
  }
  this._stream.apply(this, arguments);
  return this;
};

/**
 * Sends a new stream request.
 *
 * @api private
 */
Socket.prototype._stream = function() {
  debug('sending new streams');

  var args = slice.call(arguments)
    , type = args.shift()
    , sio = this.sio
    , pos = [];

  args = args.map(function(stream, i) {
    if (!(stream instanceof WriteStream)) {
      return stream;
    }

    if (stream.socket) {
      throw new Error('stream has already been sent.');
    }

    // keep stream positions of args.
    pos.push(i);

    var id = this.ids++;
    this.writeStreams[id] = stream;
    stream.id = id;
    stream.socket = this;

    // add listers to clean up.
    ['finish', 'error'].forEach(function(type) {
      stream.on(type, function() {
        delete this.writeStreams[id];
      }.bind(this));
    }, this);

    // represent a stream in an id.
    return id;
  }, this);

  args.unshift(exports.event, pos, type);
  sio.emit.apply(sio, args);
};

/**
 * Notifies the read event.
 *
 * @api private
 */
Socket.prototype._read = function(id, size) {
  this.sio.emit(exports.event + '-read', id, size);
};

/**
 * Requests to write a chunk.
 *
 * @api private
 */
Socket.prototype._write = function(id, chunk, encoding, callback) {
  encoding = 'base64';
  chunk = chunk.toString(encoding);
  this.sio.emit(exports.event + '-write', id, chunk, encoding, callback);
};

Socket.prototype._end = function(id) {
  this.sio.emit(exports.event + '-end', id);
};

Socket.prototype._writeerror = function(id, err) {
  this.sio.emit(exports.event + '-writeerror', id, err.message || err);
};

Socket.prototype._readerror = function(id, err) {
  this.sio.emit(exports.event + '-readerror', id, err.message || err);
};

/**
 * Handles a new stream request.
 *
 * @api private
 */
Socket.prototype._onstream = function() {
  debug('new streams');

  var args = slice.call(arguments)
    , pos = args.shift()
    , type = args.shift()
    , streams;

  args = args.map(function(id, i) {
    if (!~pos.indexOf(i)) {
      // arg is not a stream.
      return id;
    }

    if (this.readStreams[id]) {
      this._readerror(id, 'id already exists');
      return;
    }

    // TODO: enable to set options.
    var stream = this.readStreams[id] = new ReadStream(/*options*/);
    stream.id = id;
    stream.socket = this;

    // add listeners to clean up.
    ['end', 'error'].forEach(function(type) {
      stream.on(type, function() {
        delete this.readStreams[id];
      }.bind(this));
    }, this);

    return stream;
  }, this);

  args.unshift(type);
  emit.apply(this, args);
};

Socket.prototype._onread = function(id, size) {
  debug('read: "%s"', id);

  var writeStream = this.writeStreams[id];
  if (writeStream) {
    writeStream._read(size);
  } else {
    this._writeerror(id, 'invalid stream id');
  }
};

Socket.prototype._onwrite = function(id, chunk, encoding, callback) {
  debug('write: "%s"', id);

  var readStream = this.readStreams[id];
  if (readStream) {
    readStream._write(chunk, encoding, callback);
  } else {
    this._readerror(id, 'invalid stream id');
  }
};

Socket.prototype._onend = function(id) {
  debug('end: "%s"', id);

  var readStream = this.readStreams[id];
  if (readStream) {
    readStream._end();
  } else {
    this._readerror(id, 'invalid stream id');
  }
};

Socket.prototype._onwriteerror = function(id, message) {
  debug('write error: "%s", "%s"', id, message);

  var readStream = this.readStreams[id];
  if (readStream) {
    var err = new Error(message);
    err.remote = true;
    readStream.emit('error', err);
  } else {
    debug('invalid read-stream id: "%s"', id);
  }
};

Socket.prototype._onreaderror = function(id, message) {
  debug('read error: "%s", "%s"', id, message);

  var writeStream = this.writeStreams[id];
  if (writeStream) {
    var err = new Error(message);
    err.remote = true;
    writeStream.emit('error', err);
  } else {
    debug('invalid write-stream id: "%s"', id);
  }
};
