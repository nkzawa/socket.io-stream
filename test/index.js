
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
    beforeEach(function() {
      this.socket = ss(client());
      this.streams = function() {
        return Object.keys(this.socket.streams);
      };
    });

    describe('local streams', function() {
      beforeEach(function() {
        this.stream = ss.createStream();
        this.socket.emit('foo', this.stream);
        expect(this.streams().length).to.eql(1);
      });

      it('should clean up on error', function() {
        this.stream.emit('error', new Error());
        expect(this.streams().length).to.eql(0);
      });

      it('should clean up on finish', function(done) {
        var self = this;
        // clean up is done on nextTick.
        this.stream.emit('finish');
        this.stream.on('end', function() {
          expect(self.streams().length).to.eql(0);
          done();
        });
      });

      it('should clean up on end', function() {
        this.stream.emit('end');
        expect(this.streams().length).to.eql(0);
      });
    });

    describe('remote streams', function() {
      beforeEach(function(done) {
        var self = this;
        this.socket.on('foo', function(stream) {
          expect(self.streams().length).to.eql(1);
          self.stream = stream;
          done();
        });
        // emit a new stream event manually.
        this.socket._onstream([0], 'foo', 1);
      });

      it('should clean up on error', function() {
        this.stream.emit('error', new Error());
        expect(this.streams().length).to.eql(0);
      });

      it('should clean up on finish', function(done) {
        var self = this;
        // clean up is done on nextTick.
        this.stream.emit('finish');
        this.stream.on('end', function() {
          expect(self.streams().length).to.eql(0);
          done();
        });
      });

      it('should clean up on end', function() {
        this.stream.emit('end');
        expect(this.streams().length).to.eql(0);
      });
    });

    it('should clean up after both "finish" and "end" were called when allowHalfOpen is enabled', function() {
      var stream = ss.createStream({allowHalfOpen: true});
      this.socket.emit('foo', stream);
      expect(this.streams().length).to.eql(1);

      stream.emit('end');
      expect(this.streams().length).to.eql(1);

      stream.emit('finish');
      expect(this.streams().length).to.eql(0);
    });
  });
});

