var fs = require('fs')
  , _ = require('underscore')
  , expect = require('chai').expect
  , async = require('async')
  , checksum = require('checksum')
  , ss = require('../../')
  , support = require('./support')
  , client = support.client
  , port = 8888;


describe('socket.io-stream', function() {
  beforeEach(support.startServer);
  afterEach(support.stopServer);
/*
  describe('streaming', function() {
    var filename = __dirname + '/resources/frog.jpg'
      , _filename = filename + '.tmp';

    afterEach(function(done) {
      fs.unlink(_filename, done);
    });

    describe('emit to server', function() {
      it('should be able to send a file to the server', function(done) {
        this.io.of('/foo').on('connection', function(socket) {
          ss(socket).on('file', function(stream, data, callback) {
            expect(data.name).to.eql(filename);

            var dst = fs.createWriteStream(_filename);
            // use 'close' since 'finish' is not supported on the old Stream.
            dst.on('close', callback);
            stream.pipe(dst);
          });
        });

        var socket = client('/foo');
        socket.on('connect', function() {
          var stream = ss.createStream();

          ss(socket).emit('file', stream, {name: filename}, function() {
            async.map([filename, _filename], checksum.file, function(err, sums) {
              // check if two files are equal.
              expect(sums[0]).to.eql(sums[1]);
              done();
            });
          });
          fs.createReadStream(filename).pipe(stream);
        });
      });

      it('should be able to send a file to the client', function(done) {
        this.io.of('/foo').on('connection', function(socket) {
          ss(socket).on('file', function(stream, data) {
            expect(data.name).to.eql(filename);
            fs.createReadStream(filename).pipe(stream);
          });
        });

        var socket = client('/foo');
        socket.on('connect', function() {
          var stream = ss.createStream();
          ss(socket).emit('file', stream, {name: filename});

          var dst = fs.createWriteStream(_filename);
          dst.on('close', function() {
            async.map([filename, _filename], checksum.file, function(err, sums) {
              expect(sums[0]).to.eql(sums[1]);
              done();
            });
          });
          stream.pipe(dst);
        });
      });

      it('should be able to send back a file', function(done) {
        this.io.of('/foo').on('connection', function(socket) {
          ss(socket).on('file', function(stream, data) {
            expect(data.name).to.eql(filename);
            stream.pipe(stream);
          });
        });

        var socket = client('/foo');
        socket.on('connect', function() {
          var stream = ss.createStream();
          ss(socket).emit('file', stream, {name: filename});

          var dst = fs.createWriteStream(_filename);
          dst.on('close', function() {
            async.map([filename, _filename], checksum.file, function(err, sums) {
              expect(sums[0]).to.eql(sums[1]);
              done();
            });
          });
          fs.createReadStream(filename).pipe(stream).pipe(dst);
        });
      });

      it('should be able to handle multiple streams', function(done) {
        this.io.on('connection', function(socket) {
          ss(socket).on('foo', function(stream1, stream2) {
            stream1.pipe(stream2);
          });
        });

        var socket = client();
        socket.on('connect', function() {
          var stream1 = ss.createStream();
          var stream2 = ss.createStream();
          ss(socket).emit('foo', stream1, stream2);

          var dst = fs.createWriteStream(_filename);
          dst.on('close', function() {
            async.map([filename, _filename], checksum.file, function(err, sums) {
              expect(sums[0]).to.eql(sums[1]);
              done();
            });
          });
          fs.createReadStream(filename).pipe(stream1);
          stream2.pipe(dst);
        });
      });
    });

    describe('emit to client', function() {
      it('should be able to send a file to the server', function(done) {
        this.io.of('/foo').on('connection', function(socket) {
          var stream = ss.createStream();
          ss(socket).emit('file', stream, {name: filename});

          var dst = fs.createWriteStream(_filename);
          dst.on('close', function() {
            async.map([filename, _filename], checksum.file, function(err, sums) {
              expect(sums[0]).to.eql(sums[1]);
              done();
            });
          });
          stream.pipe(dst);
        });

        ss(client('/foo')).on('file', function(stream, data, callback) {
          expect(data.name).to.eql(filename);
          fs.createReadStream(filename).pipe(stream);
        });
      });

      it('should be able to send a file to the client', function(done) {
        this.io.of('/foo').on('connection', function(socket) {
          var stream = ss.createStream();
          ss(socket).emit('file', stream, {name: filename}, function(unused) {
            async.map([filename, _filename], checksum.file, function(err, sums) {
              expect(sums[0]).to.eql(sums[1]);
              done();
            });
          });
          fs.createReadStream(filename).pipe(stream);
        });

        ss(client('/foo')).on('file', function(stream, data, callback) {
          expect(data.name).to.eql(filename);

          var dst = fs.createWriteStream(_filename);
          dst.on('close', callback);
          stream.pipe(dst);
        });
      });

      it('should be able to send back a file', function(done) {
        this.io.of('/foo').on('connection', function(socket) {
          var stream = ss.createStream();
          ss(socket).emit('file', stream, {name: filename});

          var dst = fs.createWriteStream(_filename);
          dst.on('close', function() {
            async.map([filename, _filename], checksum.file, function(err, sums) {
              expect(sums[0]).to.eql(sums[1]);
              done();
            });
          });
          fs.createReadStream(filename).pipe(stream).pipe(dst);
        });

        ss(client('/foo')).on('file', function(stream, data) {
          expect(data.name).to.eql(filename);
          stream.pipe(stream);
        });
      });

      it('should be able to handle multiple streams', function(done) {
        this.io.on('connection', function(socket) {
          var stream1 = ss.createStream();
          var stream2 = ss.createStream();
          ss(socket).emit('foo', stream1, stream2);

          var dst = fs.createWriteStream(_filename);
          dst.on('close', function() {
            async.map([filename, _filename], checksum.file, function(err, sums) {
              expect(sums[0]).to.eql(sums[1]);
              done();
            });
          });
          fs.createReadStream(filename).pipe(stream1);
          stream2.pipe(dst);
        });

        ss(client()).on('foo', function(stream1, stream2) {
          stream1.pipe(stream2);
        });
      });
    });
  });
*/
  describe('errors', function() {
    it('should send a stream error of client to server', function(done) {
      this.io.sockets.on('connection', function(socket) {
        ss(socket).on('foo', function(stream) {
          stream.on('error', function(err) {
            expect(err.message).to.eql('error on the client');
            done()
          });
        });
      });

      var socket = client()
        , stream = ss.createStream();

      socket.on('connect', function() {
        ss(socket).emit('foo', stream);
        stream.emit('error', new Error('error on the client'));
      });
    });

    it('should send a stream error of server to client', function(done) {

      this.io.sockets.on('connection', function(socket) {
        ss(socket).on('foo', function(stream) {
          stream.emit('error', new Error('error on the server'));
        });
      });

      var socket = client()
        , stream = ss.createStream();

      socket.on('connect', function() {
        ss(socket).emit('foo', stream);
        stream.on('error', function(err) {
          expect(err.message).to.eql('error on the server');
          done();
        });
      });
    });
  });

  describe('order', function() {
    it('should send/receive writes in order', function(done) {
      var nums = _.map(_.range(5), String);

      // Server
      this.io.sockets.on('connection', function(socket) {
        ss(socket).on('foo', function(stream) {
          // Write nums to stream
          _.each(nums, function(num) {
            stream.write(num);
          });
        });
      });

      // Client
      var socket = client()
        , stream = ss.createStream();


      socket.on('connect', function() {
        ss(socket).emit('foo', stream);
        var x = [];
        stream.on('data', function(num) {
          x.push(num.toString());
          // Got everything
          if(x.length >= nums.length) {
            expect(_.isEqual(nums, x)).to.be.true;
            // Finished
            done();
          }
          //stream.read();
        });
      });
    })
  });
});

