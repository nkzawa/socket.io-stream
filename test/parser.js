var expect = require('expect.js');
var ss = require('..');
var parser = require('../lib/parser');

describe('parser', function() {
  it('should encode/decode a stream', function() {
    var encoder = new parser.Encoder();
    var decoder = new parser.Decoder();
    var stream = ss.createStream();
    var result = decoder.decode(encoder.encode(stream));
    expect(result).to.be.a(ss.IOStream);
    expect(result).not.to.be(stream);
  });

  it('should keep stream options', function() {
    var encoder = new parser.Encoder();
    var decoder = new parser.Decoder();
    var stream = ss.createStream({ highWaterMark: 10, objectMode: true, allowHalfOpen: true })
    var result = decoder.decode(encoder.encode(stream));
    expect(result.options).to.eql({ highWaterMark: 10, objectMode: true, allowHalfOpen: true });
  });

  it('should encode/decode every streams', function() {
    var encoder = new parser.Encoder();
    var decoder = new parser.Decoder();
    var result = decoder.decode(encoder.encode([
      ss.createStream(),
      { foo: ss.createStream() }
    ]));
    expect(result[0]).to.be.a(ss.IOStream);
    expect(result[1].foo).to.be.a(ss.IOStream);
  });

  it('should keep non-stream values', function() {
    var encoder = new parser.Encoder();
    var decoder = new parser.Decoder();
    var result = decoder.decode(encoder.encode([1, 'foo', { foo: 'bar' }, null, undefined]));
    expect(result).to.be.eql([1, 'foo', { foo: 'bar' }, null, undefined]);
  });

  describe('Encoder', function() {
    it('should fire stream event', function(done) {
      var encoder = new parser.Encoder();
      var stream = ss.createStream();
      encoder.on('stream', function(s) {
        expect(s).to.be(stream);
        done();
      });
      encoder.encode(stream);
    });
  });

  describe('Decoder', function() {
    it('should fire stream event', function() {
      var encoder = new parser.Encoder();
      var decoder = new parser.Decoder();
      var stream;
      decoder.on('stream', function(s) {
        stream = s;
      });
      var decoded = decoder.decode(encoder.encode(ss.createStream()));
      expect(stream).to.be(decoded);
    });
  });
});
