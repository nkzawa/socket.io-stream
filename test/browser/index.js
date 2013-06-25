var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , sio = require('socket.io')
  , static = require('node-static')
  , ss = require('../../')
  , port = 8888;


var file = new static.Server(__dirname + '/public');

var server = http.createServer(function(req, res) {
  req.on('end', function() {
    file.serve(req, res);
  }).resume();
});

var io = sio.listen(server);

io.of('/foo').on('connection', function(socket) {
  ss(socket).on('file', function(stream, data, callback) {
    var dst = fs.createWriteStream(path.join(__dirname, '/data.tmp'));
    dst.on('close', callback);
    stream.pipe(dst);
  });
});

server.listen(port, function() {
  console.log('server listening on port ' + port);
});
