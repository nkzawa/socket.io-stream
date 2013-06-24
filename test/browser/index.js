var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , url = require('url')
  , sio = require('socket.io')
  , send = require('send')
  , ss = require('../../')
  , port = 8888;


var server = http.createServer(function(req, res) {
  send(req, url.parse(req.url).pathname)
    .root(__dirname + '/public')
    .pipe(res);
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
