var fs = require('fs')
  , path = require('path')
  , expect = require('chai').expect
  , async = require('async')
  , checksum = require('checksum')
  , server = require('socket.io')
  , _client = require('socket.io-client')
  , ss = require('../../')
  , port = 8888;


function client(path, options) {
  path = path || '';
  options = options || {};

  var _options = {'force new connection': true};
  for (var key in options) {
    _options[key] = options[key];
  }

  return _client.connect('http://localhost:' + port + path, _options);
}

describe('socket.io-stream', function() {
  beforeEach(function(done) {
    this.io = server.listen(port, done);
  });

  afterEach(function(done) {
    var sockets = this.io.sockets.sockets;
    for (var sid in sockets) {
      if (sockets.hasOwnProperty(sid)) {
        sockets[sid].disconnect();
      }
    }
    this.io.server.close(done);
  });

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

      var stream = ss.createStream();
      ss(client('/foo')).emit('file', stream, {name: filename}, function() {
        async.map([filename, _filename], checksum.file, function(err, sums) {
          // check if two files are equal.
          expect(sums[0]).to.eql(sums[1]);
          done();
        });
      });
      fs.createReadStream(filename).pipe(stream);
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

      var stream = ss.createStream();
      ss(client()).emit('foo', stream);
      stream.emit('error', new Error('error on write-stream'));
    });

    it('should send errors to read-stream', function(done) {
      this.io.sockets.on('connection', function(socket) {
        ss(socket).on('foo', function(stream) {
          stream.emit('error', new Error('error on read-stream'));
        });
      });

      var stream = ss.createStream();
      ss(client()).emit('foo', stream);
      stream.on('error', function(err) {
        expect(err.message).to.eql('error on read-stream');
        done()
      });
    });
  });

  describe('clean up', function() {
    it('should clean up write-streams on finish and error', function() {
      var socket = ss(client(null, {'auto connect': false}))
        , stream = ss.createStream();

      function writeStreams() {
        return Object.keys(socket.writeStreams);
      }

      socket.emit('foo', stream);
      expect(writeStreams().length).to.eql(1);
      stream.emit('finish');
      expect(writeStreams().length).to.eql(0);

      stream = ss.createStream();
      socket.emit('bar', stream);
      expect(writeStreams().length).to.eql(1);
      stream.emit('error', new Error());
      expect(writeStreams().length).to.eql(0);
    });
  });
});

