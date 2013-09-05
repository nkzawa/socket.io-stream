
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

    it('should throw an error when sending destroyed streams', function() {
      var socket = ss(client())
        , stream = ss.createStream();

      stream.destroy();
      expect(function() {
        socket.emit('foo', stream);
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

      it('should be cleaned up on error', function() {
        this.stream.emit('error', new Error());
        expect(this.streams().length).to.eql(0);
      });

      it('should be cleaned up on finish', function(done) {
        var self = this;
        // clean up is done on nextTick.
        this.stream.emit('finish');
        this.stream.on('end', function() {
          setTimeout(function() {
            expect(self.streams().length).to.eql(0);
            done();
          }, 0);
        });
      });

      it('should be cleaned up on end', function() {
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
        this.socket.$emit('foo', [0], 1);
      });

      it('should be cleaned up on error', function() {
        this.stream.emit('error', new Error());
        expect(this.streams().length).to.eql(0);
      });

      it('should be cleaned up on finish', function(done) {
        var self = this;
        // clean up is not done on this tick.
        this.stream.emit('finish');
        this.stream.on('end', function() {
          setTimeout(function() {
            expect(self.streams().length).to.eql(0);
            done();
          }, 0);
        });
      });

      it('should be cleaned up on end', function() {
        this.stream.emit('end');
        expect(this.streams().length).to.eql(0);
      });
    });

    describe('when allowHalfOpen is enabled', function() {
      it('should clean up local streams only after both "finish" and "end" were called', function() {
        var stream = ss.createStream({allowHalfOpen: true});
        this.socket.emit('foo', stream);
        expect(this.streams().length).to.eql(1);

        stream.emit('end');
        expect(this.streams().length).to.eql(1);

        stream.emit('finish');
        expect(this.streams().length).to.eql(0);
      });

      it('should clean up remote streams only after both "finish" and "end" were called', function(done) {
        var self = this;
        this.socket.on('foo', {allowHalfOpen: true}, function(stream) {
          expect(self.streams().length).to.eql(1);

          stream.emit('end');
          expect(self.streams().length).to.eql(1);

          stream.emit('finish');
          expect(self.streams().length).to.eql(0);
          done();
        });
        // emit a new stream event manually.
        this.socket.$emit('foo', [0], 1);
      });
    });
  });

  describe('when socket.io has an error', function() {
    it('should propagate the error', function(done) {
      var sio = client();
      var socket = ss(sio);
      socket.on('error', function(err) {
        expect(err).to.be.an.instanceof(Error);
        done();
      });
      (sio.$emit || sio.emit).call(sio, 'error', new Error());
    });
  });

  describe('when socket.io is disconnected', function() {
    beforeEach(function() {
      var sio = client();
      var socket = ss(sio);
      this.stream = ss.createStream();
      socket.emit('foo', this.stream);

      var emit = sio.$emit || sio.emit;
      this.disconnect = function() {
        emit.call(sio, 'disconnect');
      };
    });

    it('should destroy streams', function() {
      this.disconnect();
      expect(this.stream.destroyed).to.be.true;
    });

    it('should trigger close event', function(done) {
      this.stream.on('close', done);
      this.disconnect();
    });

    it('should trigger error event', function(done) {
      this.stream.on('error', function(err) {
        expect(err).to.be.an.instanceof(Error);
        done();
      });
      this.disconnect();
    });
  });
});

