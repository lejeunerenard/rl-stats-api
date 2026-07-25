// @ts-nocheck
// Minimal TextEncoder/TextDecoder polyfill for Bare runtime
// Effect v3 requires these globals for internal encoding operations

function utf8Encode(str) {
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    } else {
      i++
      const surrogate = (code << 10) + str.charCodeAt(i) - 0x35fdc00
      bytes.push(0xf0 | (surrogate >> 18), 0x80 | ((surrogate >> 12) & 0x3f), 0x80 | ((surrogate >> 6) & 0x3f), 0x80 | (surrogate & 0x3f))
    }
  }
  return new Uint8Array(bytes)
}

function utf8Decode(bytes) {
  const result = []
  let i = 0
  while (i < bytes.length) {
    const byte1 = bytes[i]
    if (byte1 < 0x80) {
      result.push(String.fromCharCode(byte1))
      i++
    } else if (byte1 < 0xe0) {
      result.push(String.fromCharCode(((byte1 & 0x1f) << 6) | (bytes[i + 1] & 0x3f)))
      i += 2
    } else if (byte1 < 0xf0) {
      result.push(String.fromCharCode(((byte1 & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)))
      i += 3
    } else {
      const code = ((byte1 & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f)
      const surrogate = code + 0x10000
      result.push(String.fromCharCode((surrogate >> 10) | 0xd800))
      result.push(String.fromCharCode((surrogate & 0x3ff) | 0xdc00))
      i += 4
    }
  }
  return result.join('')
}

if (typeof TextEncoder === 'undefined') {
  globalThis.TextEncoder = function TextEncoder() {}
  TextEncoder.prototype.encode = function(str) {
    return utf8Encode(str)
  }
  TextEncoder.prototype.encodeInto = function(str, buffer) {
    const bytes = utf8Encode(str)
    const len = Math.min(bytes.length, buffer.length)
    for (let i = 0; i < len; i++) {
      buffer[i] = bytes[i]
    }
    return { read: bytes.length, written: len }
  }
}

if (typeof TextDecoder === 'undefined') {
  globalThis.TextDecoder = function TextDecoder() {}
  TextDecoder.prototype.decode = function(bytes) {
    return utf8Decode(bytes)
  }
}
