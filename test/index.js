
// for tests on the browser.
if ('undefined' != typeof require) {
  var chai = require('chai')
    , io = require('socket.io-client')
    , ss = require('../')
    , support = require('./support');
}

var expect = chai.expect
  , client = support.client;


describe('socket.io-stream', function() {
  describe('lookup', function() {
    it('should always return a same instance for a socket', function() {
      var socket = client();
      expect(ss(socket)).to.equal(ss(socket));
    });
  });

  describe('errors', function() {
    it('should throw an error when resending streams', function() {
      var socket = ss(client())
        , stream = ss.createStream();

      socket.emit('foo', stream);
      expect(function() {
        socket.emit('bar', stream);
      }).to.throw(Error);
    });
  });

  describe('clean up', function() {
    it('should clean up local streams on error', function() {
      var socket = ss(client())
        , stream = ss.createStream();

      function streams() {
        return Object.keys(socket.streams);
      }

      stream = ss.createStream();
      socket.emit('foo', stream);
      expect(streams().length).to.eql(1);
      stream.emit('error', new Error());
      expect(streams().length).to.eql(0);
    });

    it('should clean up remote streams on error', function() {
      var socket = ss(client())
        , stream = ss.createStream();

      function streams() {
        return Object.keys(socket.streams);
      }

      socket.on('foo', function(stream) {
        expect(streams().length).to.eql(1);
        stream.emit('error', new Error());
        expect(streams().length).to.eql(0);
      });

      // emit a new stream event manually.
      socket._onstream([0], 'foo', 1);
    });
  });
});

