var fs = require('fs')
  , path = require('path')
  , expect = require('chai').expect
  , async = require('async')
  , checksum = require('checksum')
  , server = require('socket.io')
  , _client = require('socket.io-client')
  , ss = require('../')
  , port = 8888;


function client(path) {
  path = path || '';
  return _client.connect('http://localhost:' + port + path,
      {'force new connection': true});
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

  describe('stream', function() {
    var filename = path.join(__dirname, 'resources/frog.jpg')
      , _filename = filename + '.tmp';

    it('should be able to pipe a file to the server', function(done) {
      this.io.sockets.on('connection', function(socket) {
        ss(socket).on('foo', function(stream, data, callback) {
          expect(data.name).to.eql(filename);

          var dst = fs.createWriteStream(_filename);
          dst.on('finish', callback);
          stream.pipe(dst);
        });
      });

      var stream = ss.createStream();
      ss(client()).emit('foo', stream, {name: filename}, function() {
        async.map([filename, _filename], checksum.file, function(err, sums) {
          // check if two files are equal.
          expect(sums[0]).to.eql(sums[1]);
          done();
        });
      });
      fs.createReadStream(filename).pipe(stream);
    });

    it('should be able to pipe a file to the client', function(done) {
      this.io.sockets.on('connection', function(socket) {
        var stream = ss.createStream();
        ss(socket).emit('foo', stream, {name: filename}, function(unused) {
          async.map([filename, _filename], checksum.file, function(err, sums) {
            expect(sums[0]).to.eql(sums[1]);
            done();
          });
        });
        fs.createReadStream(filename).pipe(stream);
      });

      ss(client()).on('foo', function(stream, data, callback) {
        console.log(arguments);
        expect(data.name).to.eql(filename);

        var dst = fs.createWriteStream(_filename);
        dst.on('finish', callback);
        stream.pipe(dst);
      });
    });
  });

  describe('error', function() {
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
      var socket = ss(client())
        , stream = ss.createStream();

      // suppress connection error.
      socket.on('error', function() {});

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

    it('should clean up read-streams on end and error', function() {
      var socket = ss(client())
        , stream = ss.createStream();

      // suppress connection errors.
      socket.on('error', function() {});

      function readStreams() {
        return Object.keys(socket.readStreams);
      }

      socket.on('foo', function(stream) {
        expect(readStreams().length).to.eql(1);
        stream.emit('end');
        expect(readStreams().length).to.eql(0);
      });

      // emit a new stream event manually.
      socket._onstream([0], 'foo', 0);

      socket.on('bar', function(stream) {
        expect(readStreams().length).to.eql(1);
        stream.emit('error', new Error());
        expect(readStreams().length).to.eql(0);
      });

      socket._onstream([0], 'bar', 1);
    });
  });
});

