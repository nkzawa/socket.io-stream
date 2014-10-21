var expect = require('expect.js');
var Blob = require('blob');
var ss = require('../');
var support = require('./support');
var client = support.client;

describe('socket.io-stream', function() {
  this.timeout(70000);

  it('should send/receive a file', function(done) {
    var sums = [];
    var socket = client();
    socket.on('connect', function() {
      var file = ss.createStream();
      ss(socket).emit('read', file, 'test/support/frog.jpg', function(sum) {
        check(sum);
      });

      var checksum = ss.createStream();
      ss(socket).emit('checksum', checksum, function(sum) {
        check(sum);
      });

      file.pipe(checksum);

      function check(sum) {
        sums.push(sum);
        if (sums.length < 2) return;
        expect(sums[0]).to.equal(sums[1]);
        socket.disconnect();
        done();
      }
    });
  });

  it('should send/receive data', function(done) {
    var socket = client();
    socket.on('connect', function() {
      var stream = ss.createStream();
      ss(socket)
        .emit('echo', stream, { hi: 1 })
        .on('echo', function(stream, obj) {
          expect(obj).to.eql({ hi: 1 });

          var data = '';
          stream.on('data', function(chunk) {
            data += chunk;
          }).on('end', function() {
            expect(data).to.equal('foobar');
            socket.disconnect();
            done();
          });
        });

      stream.write('foo');
      stream.write('bar');
      stream.end();
    });
  });

  it('should send/receive data through a same stream', function(done) {
    var socket = client();
    socket.on('connect', function() {
      var stream = ss.createStream({ allowHalfOpen: true });
      ss(socket).emit('sendBack', stream);
      stream.write('foo');
      stream.write('bar');
      stream.end();

      var data = '';
      stream.on('data', function(chunk) {
        data += chunk;
      }).on('end', function() {
        expect(data).to.equal('foobar');
        socket.disconnect();
        done();
      });
    });
  });

  it('should handle multiple streams', function(done) {
    var socket = client();
    socket.on('connect', function() {
      var stream1 = ss.createStream();
      var stream2 = ss.createStream();
      ss(socket).emit('multi', stream1, stream2);
      stream1.write('foo');
      stream1.write('bar');
      stream1.end();

      var data = '';
      stream2.on('data', function(chunk) {
        data += chunk;
      }).on('end', function() {
        expect(data).to.equal('foobar');
        socket.disconnect();
        done();
      });
    });
  });

  it('should send an error happened on the client', function(done) {
    var socket = client();
    socket.on('connect', function() {
      var stream = ss.createStream();
      ss(socket).emit('clientError', stream, function(msg) {
        expect(msg).to.equal('error on the client');
        done()
      });
      stream.emit('error', new Error('error on the client'));
    });
  });

  it('should receive an error happened on the server', function(done) {
    var socket = client();
    socket.on('connect', function() {
      var stream = ss.createStream();
      ss(socket).emit('serverError', stream, 'error on the server');
      stream.on('error', function(err) {
        expect(err.message).to.equal('error on the server');
        done()
      });
    });
  });

  if (Blob) {
    describe('BlobReadStream', function() {
      it('should read blob', function(done) {
        var socket = client();
        socket.on('connect', function() {
          var stream = ss.createStream();
          ss(socket)
            .emit('echo', stream)
            .on('echo', function(stream) {
              var data = '';
              stream.on('data', function(chunk) {
                data += chunk;
              }).on('end', function() {
                expect(data).to.equal('foobar');
                socket.disconnect();
                done();
              });
            });
          ss.createBlobReadStream(new Blob(['foo', 'bar'])).pipe(stream);
        });
      });
    });
  }
});

