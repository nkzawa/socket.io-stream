var expect = require('expect.js');
var io = require('socket.io-client');
var ss = require('../');
var client = require('./support').client;

describe('socket.io-stream', function() {

  it('should expose values', function() {
    expect(ss.Buffer).to.be(Buffer);
    expect(ss.Socket).to.be.a('function');
    expect(ss.forceBase64).to.be.a('boolean');
  });

  it('should always return a same instance for a socket', function() {
    var socket = client({ autoConnect: false });
    expect(ss(socket)).to.be(ss(socket));
  });

  it('should throw an error when resending a stream', function() {
    var socket = ss(client({ autoConnect: false }));
    var stream = ss.createStream();

    socket.emit('foo', stream);
    expect(function() {
      socket.emit('bar', stream);
    }).to.throwError();
  });

  it('should throw an error when sending destroyed streams', function() {
    var socket = ss(client({ autoConnect: false }));
    var stream = ss.createStream();

    stream.destroy();
    expect(function() {
      socket.emit('foo', stream);
    }).to.throwError();
  });

  describe('clean up', function() {
    beforeEach(function() {
      this.socket = ss(client({ autoConnect: false }));
      this.streams = function() {
        return Object.keys(this.socket.streams);
      };
    });

    describe('local streams', function() {
      beforeEach(function() {
        this.stream = ss.createStream();
        this.socket.emit('foo', this.stream);
        expect(this.streams()).to.have.length(1);
      });

      it('should be cleaned up on error', function() {
        this.stream.emit('error', new Error());
        expect(this.streams()).to.have.length(0);
      });

      it('should be cleaned up on finish', function(done) {
        var self = this;
        this.stream.on('end', function() {
          expect(self.streams()).to.have.length(0);
          done();
        });
        this.stream.emit('finish');
      });

      it('should be cleaned up on end', function() {
        this.stream.emit('end');
        expect(this.streams()).to.have.length(0);
      });
    });

    describe('remote streams', function() {
      beforeEach(function(done) {
        var self = this;
        this.socket.on('foo', function(stream) {
          expect(self.streams()).to.have.length(1);
          self.stream = stream;
          done();
        });
        // emit a new stream event manually.
        this.socket.$emit('foo', [0], 1);
      });

      it('should be cleaned up on error', function() {
        this.stream.emit('error', new Error());
        expect(this.streams()).to.have.length(0);
      });

      it('should be cleaned up on finish', function(done) {
        var self = this;
        this.stream.on('end', function() {
          expect(self.streams()).to.have.length(0);
          done();
        });
        this.stream.emit('finish');
      });

      it('should be cleaned up on end', function() {
        this.stream.emit('end');
        expect(this.streams()).to.have.length(0);
      });
    });

    describe('when allowHalfOpen is enabled', function() {
      it('should clean up local streams only after both "finish" and "end" were called', function() {
        var stream = ss.createStream({allowHalfOpen: true});
        this.socket.emit('foo', stream);
        expect(this.streams()).to.have.length(1);

        stream.emit('end');
        expect(this.streams()).to.have.length(1);

        stream.emit('finish');
        expect(this.streams()).to.have.length(0);
      });

      it('should clean up remote streams only after both "finish" and "end" were called', function(done) {
        var self = this;
        this.socket.on('foo', {allowHalfOpen: true}, function(stream) {
          expect(self.streams()).to.have.length(1);

          stream.emit('end');
          expect(self.streams()).to.have.length(1);

          stream.emit('finish');
          expect(self.streams()).to.have.length(0);
          done();
        });
        // emit a new stream event manually.
        this.socket.$emit('foo', [0], 1);
      });
    });
  });

  describe('when socket.io has an error', function() {
    it('should propagate the error', function(done) {
      var sio = client({ autoConnect: false });
      var socket = ss(sio);
      socket.on('error', function(err) {
        expect(err).to.be.an(Error);
        done();
      });
      (sio.$emit || sio.emit).call(sio, 'error', new Error());
    });
  });

  describe('when socket.io is disconnected', function() {
    beforeEach(function() {
      var sio = client({ autoConnect: false });
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
      expect(this.stream.destroyed).to.be.ok();
    });

    it('should trigger close event', function(done) {
      this.stream.on('close', done);
      this.disconnect();
    });

    it('should trigger error event', function(done) {
      this.stream.on('error', function(err) {
        expect(err).to.be.an(Error);
        done();
      });
      this.disconnect();
    });
  });
});

