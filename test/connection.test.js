const ss = require('..');
const support = require('./support');
const server = require('./support/server')
const client = support.client;

describe('socket.io-stream', function() {
  let socket;
  beforeEach(() => {
    socket = client()
  });

  afterEach(() => {
    socket.disconnect()
  });

  afterAll(() => {
    server.close()
  });

  it('should send/receive a file', function(done) {
    const sums = [];
    socket.on('connect', function() {
      const file = ss.createStream();
      ss(socket).emit('read', file, 'test/support/frog.jpg', function(sum) {
        check(sum);
      });

      const checksum = ss.createStream();
      ss(socket).emit('checksum', checksum, function(sum) {
        check(sum);
      });

      file.pipe(checksum);

      function check(sum) {
        sums.push(sum);
        if (sums.length < 2) return;
        expect(sums[0]).toEqual(sums[1]);
        done();
      }
    });
  }, 7000);

  it('should send/receive data in flowing mode', function(done) {
    socket.on('connect', function() {
      const stream = ss.createStream();
      ss(socket)
        .emit('echo', stream, { hi: 1 })
        .on('echo', function(stream, obj) {
          expect(obj).toEqual({ hi: 1 });

          let data = '';
          stream.on('data', function(chunk) {
            data += chunk;
          }).on('end', function() {
            expect(data).toBe('foobar');
            socket.disconnect();
            done();
          });
        });

      stream.write('foo');
      stream.write('bar');
      stream.end();
    });
  }, 7000);

  it('should send/receive data in paused mode', function(done) {
    socket.on('connect', function() {
      const stream = ss.createStream();
      ss(socket)
        .emit('echo', stream, { hi: 1 })
        .on('echo', function(stream, obj) {
          expect(obj).toEqual({ hi: 1 });

          let data = '';
          stream.on('readable', function() {
            let chunk;
            while (null !== (chunk = stream.read())) {
              data += chunk;
            }
          }).on('end', function() {
            expect(data).toBe('foobar');
            socket.disconnect();
            done();
          });
        });

      stream.write('foo');
      stream.write('bar');
      stream.end();
    });
  }, 7000);

  it('should send/receive Buffer', function(done) {
    socket.on('connect', function() {
      const stream = ss.createStream();
      ss(socket)
        .emit('echo', stream)
        .on('echo', function(stream) {
          const buffers = [];
          stream.on('data', function(chunk) {
            buffers.push(chunk);
          }).on('end', function() {
            const buffer = Buffer.concat(buffers);
            expect(buffer.length).toBe(4);
            for (let i = 0; i < 4; i++) {
              expect(buffer[i]).toBe(i);
            }
            socket.disconnect();
            done();
          });
        });

      stream.write(Buffer.from([0, 1]));
      stream.write(Buffer.from([2, 3]));
      stream.end();
    });
  }, 7000);

  it('should send/receive an object in object mode', function(done) {
    socket.on('connect', function() {
      const stream = ss.createStream({ objectMode: true });
      ss(socket)
        .emit('echo', stream)
        .on('echo', function(stream) {
          const data = [];
          stream.on('data', function(chunk) {
            data.push(chunk);
          }).on('end', function() {
            expect(data.length).toBe(2);;
            expect(data[0]).toEqual({ foo: 0 });
            expect(data[1]).toEqual({ bar: 1 });
            socket.disconnect();
            done();
          });
        });

      stream.write({ foo: 0 });
      stream.write({ bar: 1 });
      stream.end();
    });
  }, 7000);

  it('should send/receive streams in an array', function(done) {
    socket.on('connect', function() {
      ss(socket)
        .emit('echo', [ss.createStream(), ss.createStream()])
        .on('echo', function(data) {
          expect(data[0]).toStrictEqual(expect.any(ss.IOStream));
          expect(data[1]).toStrictEqual(expect.any(ss.IOStream));
          socket.disconnect();
          done();
        });
    });
  }, 7000);

  it('should send/receive streams in an object', function(done) {
    socket.on('connect', function() {
      ss(socket)
        .emit('echo', {
          foo: ss.createStream(),
          bar: ss.createStream()
        })
        .on('echo', function(data) {
          expect(data.foo).toStrictEqual(expect.any(ss.IOStream));
          expect(data.bar).toStrictEqual(expect.any(ss.IOStream));
          socket.disconnect();
          done();
        });
    });
  }, 7000);

  it('should send/receive data through a same stream', function(done) {
    socket.on('connect', function() {
      const stream = ss.createStream({ allowHalfOpen: true });
      ss(socket).emit('sendBack', stream);
      stream.write('foo');
      stream.write('bar');
      stream.end();

      let data = '';
      stream.on('data', function(chunk) {
        data += chunk;
      }).on('end', function() {
        expect(data).toEqual('foobar');
        done();
      });
    });
  }, 7000);

  it('should handle multiple streams', function(done) {
    socket.on('connect', function() {
      const stream1 = ss.createStream();
      const stream2 = ss.createStream();
      ss(socket).emit('multi', stream1, stream2);
      stream1.write('foo');
      stream1.write('bar');
      stream1.end();

      let data = '';
      stream2.on('data', function(chunk) {
        data += chunk;
      }).on('end', function() {
        expect(data).toEqual('foobar');
        done();
      });
    });
  }, 7000);

  it('should get a stream through ack', function(done) {
    socket.on('connect', function() {
      const stream = ss.createStream();
      ss(socket).emit('ack', stream, function(stream) {
        let data = '';
        stream.on('data', function(chunk) {
          data += chunk;
        }).on('end', function() {
          expect(data).toEqual('foobar');
          socket.disconnect();
          done();
        });
      });

      stream.write('foo');
      stream.write('bar');
      stream.end();
    });
  }, 7000);

  it('should get streams through ack as object and array', function(done) {
    socket.on('connect', function() {
      ss(socket).emit('ack', [ss.createStream(), { foo: ss.createStream() }], function(data) {
        expect(data[0]).toStrictEqual(expect.any(ss.IOStream));
        expect(data[1].foo).toStrictEqual(expect.any(ss.IOStream));
        done();
      });
    });
  }, 7000);

  it('should send an error happened on the client', function(done) {
    socket.on('connect', function() {
      const stream = ss.createStream();
      ss(socket).emit('clientError', stream, function(msg) {
        expect(msg).toEqual('error on the client');
        done()
      });
      stream.emit('error', new Error('error on the client'));
    });
  }, 7000);

  it('should receive an error happened on the server', function(done) {
    socket.on('connect', function() {
      const stream = ss.createStream();
      ss(socket).emit('serverError', stream, 'error on the server');
      stream.on('error', function(err) {
        expect(err.message).toEqual('error on the server');
        done()
      });
    });
  }, 7000);

  if (Buffer.Blob) {
    describe('BlobReadStream', function() {
      it('should read blob', function(done) {
        const socket = client();
        socket.on('connect', function() {
          const stream = ss.createStream();
          ss(socket)
            .emit('echo', stream)
            .on('echo', function(stream) {
              const data = '';
              stream.on('data', function(chunk) {
                data += chunk;
              }).on('end', function() {
                expect(data).toEqual('foobar');
                socket.disconnect();
                done();
              });
            });
          ss.createBlobReadStream(new Buffer.Blob(['foo', 'bar'])).pipe(stream);
        });
      });
    }, 7000);
  }
});

