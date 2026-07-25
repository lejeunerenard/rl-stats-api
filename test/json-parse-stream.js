const test = require('brittle')
require("bare-encoding/global")

const { Option } = require('effect')
const { join } = require('path')
const { createReadStream } = require('fs')
const { extractOneObject } = require('../dist/lib/json-parse-stream.js')

function parseAll(input) {
  const results = []
  let buffer = input
  let result
  do {
    result = extractOneObject(buffer)
    if (Option.isSome(result)) {
      results.push(result.value.parsed)
      buffer = result.value.remainder
    }
  } while (Option.isSome(result))
  return results
}

test('parseJSONStream - parses json 100bytes at a time', async (t) => {
  const fixturePath = join(__dirname, './fixtures/update-state-simple.json')
  const fs = require('fs')
  const content = fs.readFileSync(fixturePath, 'utf8')

  // Simulate reading in 100-byte chunks
  let buffer = ''
  const chunks = []
  for (let i = 0; i < content.length; i += 100) {
    chunks.push(content.substring(i, i + 100))
  }
  for (const chunk of chunks) {
    buffer += chunk
  }

  const result = parseAll(buffer)
  const json = require(fixturePath)
  t.alike(result, [json], 'parses json emitted per line')
})

test('parseJSONStream - parse json even when emitted with start of next', async (t) => {
  const input = '{ "foo": "bar" }{ "biz": "baz" }'
  const result = parseAll(input)
  t.alike(result, [{ foo: 'bar' }, { biz: 'baz' }], 'returns two objs')
})

test('parseJSONStream - handles split across multiple writes', async (t) => {
  const json = JSON.stringify({
    Event: 'GoalScored',
    Data: {
      MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
      GoalSpeed: 87.3,
      GoalTime: 127.5,
      ImpactLocation: { X: 0, Y: -2944, Z: 320 },
      Scorer: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
      BallLastTouch: { Player: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }, Speed: 125 }
    }
  })

  // Split into 20-byte chunks and accumulate
  let buffer = ''
  for (let i = 0; i < json.length; i += 20) {
    buffer += json.substring(i, i + 20)
  }

  const result = parseAll(buffer)
  t.ok(result.length === 1)
  t.ok(result[0].Event === 'GoalScored')
  t.ok(result[0].Data.GoalSpeed === 87.3)
})

test('parseJSONStream - handles multiple events in single input', async (t) => {
  const event1 = JSON.stringify({
    Event: 'GoalScored',
    Data: {
      MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
      GoalSpeed: 87.3,
      GoalTime: 127.5,
      ImpactLocation: { X: 0, Y: -2944, Z: 320 },
      Scorer: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
      BallLastTouch: { Player: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }, Speed: 125 }
    }
  })

  const event2 = JSON.stringify({
    Event: 'BallHit',
    Data: {
      MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
      Players: [{ Name: 'PlayerB', Shortcut: 2, TeamNum: 1 }],
      Ball: { PreHitSpeed: 100, PostHitSpeed: 1450.2, Location: { X: -512, Y: 100, Z: 200 } }
    }
  })

  const input = event1 + '\n' + event2
  const result = parseAll(input)
  t.ok(result.length === 2)
  t.ok(result[0].Event === 'GoalScored')
  t.ok(result[1].Event === 'BallHit')
})
