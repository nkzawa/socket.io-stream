const ss = require('..');
const parser = require('../lib/parser');
const Stream = require('stream').Stream

describe('parser', function() {
  it('should encode/decode a stream', function() {
    const encoder = new parser.Encoder();
    const decoder = new parser.Decoder();
    const stream = ss.createStream();
    const result = decoder.decode(encoder.encode(stream));
    expect(result).toStrictEqual(expect.any(ss.IOStream));
    expect(result).not.toBe(expect.any(Stream));
  });

  it('should keep stream options', function() {
    const encoder = new parser.Encoder();
    const decoder = new parser.Decoder();
    const stream = ss.createStream({ highWaterMark: 10, objectMode: true, allowHalfOpen: true })
    const result = decoder.decode(encoder.encode(stream));
    expect(result.options).toEqual({ highWaterMark: 10, objectMode: true, allowHalfOpen: true });
  });

  it('should encode/decode every streams', function() {
    const encoder = new parser.Encoder();
    const decoder = new parser.Decoder();
    const result = decoder.decode(encoder.encode([
      ss.createStream(),
      { foo: ss.createStream() }
    ]));
    expect(result[0]).toStrictEqual(expect.any(ss.IOStream));
    expect(result[1].foo).toStrictEqual(expect.any(ss.IOStream));
  });

  it('should keep non-stream values', function() {
    const encoder = new parser.Encoder();
    const decoder = new parser.Decoder();
    const result = decoder.decode(encoder.encode([1, 'foo', { foo: 'bar' }, null, undefined]));
    expect(result).toEqual([1, 'foo', { foo: 'bar' }, null, undefined]);
  });

  describe('Encoder', function() {
    it('should fire stream event', function(done) {
      const encoder = new parser.Encoder();
      const stream = ss.createStream();
      encoder.on('stream', function(s) {
        expect(s).toBe(stream);
        done();
      });
      encoder.encode(stream);
    });
  });

  describe('Decoder', function() {
    it('should fire stream event', function() {
      const encoder = new parser.Encoder();
      const decoder = new parser.Decoder();
      let stream;
      decoder.on('stream', function(s) {
        stream = s;
      });
      const decoded = decoder.decode(encoder.encode(ss.createStream()));
      expect(stream).toBe(decoded);
    });
  });
});
