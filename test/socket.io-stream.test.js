const io = require('socket.io-client');
const ss = require('../');
const parser = require('../lib/parser');
const server = require('./support/server')
const client = require('./support').client;

afterAll(() => {
  server.close()
})

describe('socket.io-stream', function() {
  it('should expose values', function() {
    expect(ss.Buffer).toBe(Buffer);
    expect(ss.Socket).toStrictEqual(expect.any(Function));
    expect(ss.IOStream).toStrictEqual(expect.any(Function));
    expect(ss.forceBase64).toStrictEqual(expect.any(Boolean));
  });

  it('should always return a same instance for a socket', function() {
    const socket = client({ autoConnect: false });
    expect(ss(socket)).toEqual(ss(socket));
  });

  it('should throw an error when resending a stream', function() {
    const socket = ss(client({ autoConnect: false }));
    const stream = ss.createStream();

    socket.emit('foo', stream);
    expect(function() {
      socket.emit('bar', stream);
    }).toThrow();
  });

  it('should throw an error when sending destroyed streams', function() {
    const socket = ss(client({ autoConnect: false }));
    const stream = ss.createStream();

    stream.destroy();
    expect(function() {
      socket.emit('foo', stream);
    }).toThrow();
  });

  describe('clean up', function() {
    let socket;
    let streams;
    beforeEach(function() {
      socket = ss(client({ autoConnect: false }));
      streams = function() {
        return Object.keys(socket.streams);
      };
    });

    describe('local streams', function() {
      let stream
      beforeEach(function() {
        stream = ss.createStream();
        socket.emit('foo', stream);
        expect(streams()).toHaveLength(1);
      });

      it('should be cleaned up on error', function() {
        stream.emit('error', new Error());
        expect(streams()).toHaveLength(0);
      });

      it('should be cleaned up on finish', function(done) {
        stream.on('end', function() {
          expect(streams()).toHaveLength(0);
          done();
        });
        stream.emit('finish');
      });

      it('should be cleaned up on end', function(done) {
        stream.emit('end');
        setTimeout(() => {
          expect(streams()).toHaveLength(0);
          done();
        }, 100)
      });
    });

    describe('remote streams', function() {
      let stream
      beforeEach(function(done) {
        socket.on('foo', function(streamIn) {
          expect(streams()).toHaveLength(1);
          stream = streamIn
          done();
        });
        // emit a new stream event manually.
        const encoder = new parser.Encoder();
        socket.$emit('foo', encoder.encode(ss.createStream()));
      });

      it('should be cleaned up on error', function() {
        stream.emit('error', new Error());
        expect(streams()).toHaveLength(0);
      });

      it('should be cleaned up on finish', function(done) {
        stream.on('end', function() {
          expect(streams()).toHaveLength(0);
          done();
        });
        stream.emit('finish');
      });

      it('should be cleaned up on end', function(done) {
        stream.emit('end');
        setTimeout(() => {
          expect(streams()).toHaveLength(0);
          done();
        }, 100)
      });
    });

    describe('when allowHalfOpen is enabled', function() {
      it('should clean up local streams only after both "finish" and "end" were called', function() {
        const stream = ss.createStream({ allowHalfOpen: true });
        socket.emit('foo', stream);
        expect(streams()).toHaveLength(1);

        stream.emit('end');
        expect(streams()).toHaveLength(1);

        stream.emit('finish');
        expect(streams()).toHaveLength(0);
      });

      it('should clean up remote streams only after both "finish" and "end" were called', function(done) {
        socket.on('foo', function(stream) {
          expect(streams()).toHaveLength(1);

          stream.emit('end');
          expect(streams()).toHaveLength(1);

          stream.emit('finish');
          expect(streams()).toHaveLength(0);
          done();
        });
        // emit a new stream event manually.
        const encoder = new parser.Encoder();
        socket.$emit('foo', encoder.encode(ss.createStream({ allowHalfOpen: true })));
      });
    });
  });

  // TODO: Don't know how to make socket.IO emit errors now (old way doesn't work any more)
  // describe('when socket.io has an error', function() {
  //   it.only('should propagate the error', function(done) {
  //     const sio = client({ autoConnect: false });
  //     const socket = ss(sio);
  //     socket.on('error', function(err) {
  //       expect(err).toStrictEqual(expect.any(Error));
  //       done();
  //     });
  //     sio.emit("error", new Error())
  //   });
  // });

  describe('when socket.io is disconnected', function() {
    let socket
    let sio
    let stream
    beforeEach(function(done) {
      sio = client();
      socket = ss(sio);
      stream = ss.createStream();
      socket.emit('foo', stream);
      setTimeout(done, 500) // Wait for server to finish setting up (otherwise disconnect doesn't fire)
    });

    it('should destroy streams', function(done) {
      sio.disconnect();
      setTimeout(() => {
        expect(stream.destroyed).toBeTruthy();
        done();
      }, 1000);
    });

    it('should trigger close event', function(done) {
      stream.on('close', done);
      sio.disconnect();
    });

    it('should trigger error event', function(done) {
      stream.on('error', function(err) {
        expect(err).toStrictEqual(expect.any(Error));
        done();
      });
      sio.disconnect();
    });
  });
});

