var fs = require('fs')
  , path = require('path')
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

  describe('streaming', function() {
    var filename = path.join(__dirname, 'resources/frog.jpg')
      , _filename = filename + '.tmp';

    it('should be able to pipe a file to the server', function(done) {
      this.io.of('/foo').on('connection', function(socket) {
        ss(socket).on('file', function(stream, data, callback) {
          expect(data.name).to.eql(filename);

          var dst = fs.createWriteStream(_filename);
          // use 'close' since 'finish' is not supported on the old Stream.
          dst.on('close', callback);
          stream.pipe(dst);
        });
      });

      var socket = client('/foo')
        , stream = ss.createStream();

      socket.on('connect', function() {
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

    it('should be able to pipe a file to the client', function(done) {
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
  });

  describe('errors', function() {
    it('should send errors to write-stream', function(done) {
      this.io.sockets.on('connection', function(socket) {
        ss(socket).on('foo', function(stream) {
          stream.on('error', function(err) {
            expect(err.message).to.eql('error on write-stream');
            done()
          });
        });
      });

      var socket = client()
        , stream = ss.createStream();

      socket.on('connect', function() {
        ss(socket).emit('foo', stream);
        stream.emit('error', new Error('error on write-stream'));
      });
    });

    it('should send errors to read-stream', function(done) {
      this.io.sockets.on('connection', function(socket) {
        ss(socket).on('foo', function(stream) {
          stream.emit('error', new Error('error on read-stream'));
        });
      });

      var socket = client()
        , stream = ss.createStream();

      socket.on('connect', function() {
        ss(socket).emit('foo', stream);
        stream.on('error', function(err) {
          expect(err.message).to.eql('error on read-stream');
          done()
        });
      });
    });
  });
});

