var util = require('util');
var EventEmitter = require('events').EventEmitter;
var IOStream = require('./iostream');
var uuid = require('./uuid');
var bind = require('component-bind');
var debug = require('debug')('socket.io-stream:socket');
var emit = EventEmitter.prototype.emit;
var on = EventEmitter.prototype.on;
var slice = Array.prototype.slice;


exports = module.exports = Socket;

/**
 * Base event name for messaging.
 *
 * @api public
 */
exports.event = '$stream';

exports.events = [
  'error',
  'newListener',
  'removeListener'
];

util.inherits(Socket, EventEmitter);

/**
 * Bidirectional stream socket which wraps Socket.IO.
 *
 * @param {socket.io#Socket} socket.io
 * @api public
 */
function Socket(sio, options) {
  if (!(this instanceof Socket)) {
    return new Socket(sio, options);
  }

  EventEmitter.call(this);

  options = options || {};

  this.sio = sio;
  this.forceBase64 = !!options.forceBase64;
  this.streams = {};

  var eventName = exports.event;
  sio.on(eventName, bind(this, emit));
  sio.on(eventName + '-read', bind(this, '_onread'));
  sio.on(eventName + '-write', bind(this, '_onwrite'));
  sio.on(eventName + '-end', bind(this, '_onend'));
  sio.on(eventName + '-error', bind(this, '_onerror'));
  sio.on('error', bind(this, emit, 'error'));
  sio.on('disconnect', bind(this, '_ondisconnect'));
}

/**
 * Original emit function.
 *
 * @api private
 */
Socket.prototype.$emit = emit;

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

Socket.prototype.on = function(type, options, listener) {
  if (~exports.events.indexOf(type)) {
    return on.apply(this, arguments);
  }

  if ('function' == typeof options) {
    listener = options;
    options = null;
  }
  this._onstream(type, options, listener);
  return this;
};

/**
 * Sends a new stream request.
 *
 * @param {String} event type
 * @api private
 */
Socket.prototype._stream = function(type) {
  debug('sending new streams');

  var args = slice.call(arguments, 1)
    , pos = []
    , sio = this.sio;

  args = args.map(function(stream, i) {
    if (!(stream instanceof IOStream)) {
      return stream;
    }

    if (stream.socket || stream.destroyed) {
      throw new Error('stream has already been sent.');
    }

    // keep stream positions of args.
    pos.push(i);

    // Generate
    var id = uuid();
    this.streams[id] = stream;
    stream.id = id;
    stream.socket = this;

    // represent a stream in an id.
    return id;
  }, this);

  sio.emit.apply(sio, [exports.event, type, pos].concat(args));
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
  if (this.forceBase64) {
    encoding = 'base64';
    chunk = chunk.toString(encoding);
  } else if (Buffer.isBuffer(chunk) && !global.Buffer) {
    // socket.io can't handle Buffer when using browserify.
    chunk = chunk.toArrayBuffer();
  }
  this.sio.emit(exports.event + '-write', id, chunk, encoding, callback);
};

Socket.prototype._end = function(id) {
  this.sio.emit(exports.event + '-end', id);
};

Socket.prototype._error = function(id, err) {
  this.sio.emit(exports.event + '-error', id, err.message || err);
};

/**
 * Handles a new stream request.
 *
 * @param {String} event type
 * @param {Object} options for streams
 * @param {Function} listener
 *
 * @api private
 */
Socket.prototype._onstream = function(type, options, listener) {
  if ('function' != typeof listener) {
    throw TypeError('listener must be a function');
  }

  function onstream(pos) {
    debug('new streams');
    var args = slice.call(arguments, 1);

    args = args.map(function(id, i) {
      if (!~pos.indexOf(i)) {
        // arg is not a stream.
        return id;
      }

      if (this.streams[id]) {
        this._error(id, 'id already exists');
        return;
      }

      var stream = this.streams[id] = new IOStream(options);
      stream.id = id;
      stream.socket = this;

      return stream;
    }, this);

    listener.apply(this, args);
  }
  // for removeListener
  onstream.listener = listener;

  on.call(this, type, onstream);
};

Socket.prototype._onread = function(id, size) {
  debug('read: "%s"', id);

  var stream = this.streams[id];
  if (stream) {
    stream._onread(size);
  } else {
    this._error(id, 'invalid stream id');
  }
};

Socket.prototype._onwrite = function(id, chunk, encoding, callback) {
  debug('write: "%s"', id);

  var stream = this.streams[id];
  if (!stream) {
    this._error(id, 'invalid stream id');
    return;
  }

  if (global.ArrayBuffer && chunk instanceof ArrayBuffer) {
    // make sure that chunk is a buffer for stream
    chunk = new Buffer(new Uint8Array(chunk));
  }
  stream._onwrite(chunk, encoding, callback);
};

Socket.prototype._onend = function(id) {
  debug('end: "%s"', id);

  var stream = this.streams[id];
  if (!stream) {
    debug('ignore non-existent stream id: "%s"', id);
    return;
  }

  stream._end();
};

Socket.prototype._onerror = function(id, message) {
  debug('error: "%s", "%s"', id, message);

  var stream = this.streams[id];
  if (!stream) {
    debug('invalid stream id: "%s"', id);
    return;
  }

  var err = new Error(message);
  err.remote = true;
  stream.emit('error', err);
};

Socket.prototype._ondisconnect = function() {
  var stream;
  for (var id in this.streams) {
    stream = this.streams[id];
    stream.destroy();

    // Close streams when the underlaying
    // socket.io connection is closed (regardless why)
    stream.emit('close');
    stream.emit('error', new Error('Connection aborted'));
  }
};

Socket.prototype.cleanup = function(id) {
  delete this.streams[id];
};

