const test = require('brittle')
const parseJSONStream = require('../dist/lib/json-parse-stream.js').default
const { join } = require('path')
const { createReadStream } = require('fs')
const { Readable } = require('stream')

test('parseJSONStream - parses json 100bytes at a time', async (t) => {
  const fixturePath = join(__dirname, './fixtures/update-state-simple.json')
  const fileStream = createReadStream(fixturePath, { highWaterMark: 100 })

  const stream = fileStream.pipe(new parseJSONStream())
  const result = await reduce(stream)

  const json = require(fixturePath)
  t.alike(result, [json], 'parses json emitted per line')
})

test('parseJSONStream - parse json even when emitted with start of next', async (t) => {
  const input = new Readable()

  input.push('{ "foo": ')
  input.push('"bar" }{ "biz": "baz" }')
  input.push(null)

  const stream = input.pipe(new parseJSONStream())
  const result = await reduce(stream)

  t.alike(result, [{ foo: 'bar' }, { biz: 'baz' }], 'returns two objs')
})

const reduce = async (stream) => {
  const arr = []
  for await (const data of stream) {
    arr.push(data)
  }
  return arr
}
