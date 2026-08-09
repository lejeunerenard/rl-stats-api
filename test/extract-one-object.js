const test = require('brittle')
const fs = require('fs')
const path = require('path')
const { Option } = require('effect')
const { extractOneObject } = require('../dist/lib/json-parse-stream.js')

test('extractOneObject - parses simple object', (t) => {
  const input = '{"foo":"bar"}'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.foo, 'bar')
  t.is(result.value.remainder, '')
})

test('extractOneObject - returns remainder after parsed object', (t) => {
  const input = '{"foo":"bar"}{"baz":"qux"}'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.foo, 'bar')
  t.is(result.value.remainder, '{"baz":"qux"}')
})

test('extractOneObject - handles nested objects', (t) => {
  const input = '{"a":{"b":{"c":1}}}'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.a.b.c, 1)
  t.is(result.value.remainder, '')
})

test('extractOneObject - handles arrays', (t) => {
  const input = '[1,2,3]'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.alike(result.value.parsed, [1, 2, 3])
  t.is(result.value.remainder, '')
})

test('extractOneObject - handles objects with arrays', (t) => {
  const input = '{"items":[1,2,3]}'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.alike(result.value.parsed.items, [1, 2, 3])
  t.is(result.value.remainder, '')
})

test('extractOneObject - handles braces inside strings', (t) => {
  const input = '{"message":"Use { and } for objects"}'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.message, 'Use { and } for objects')
  t.is(result.value.remainder, '')
})

test('extractOneObject - handles brackets inside strings', (t) => {
  const input = '{"list":"[1,2,3]"}'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.list, '[1,2,3]')
  t.is(result.value.remainder, '')
})

test('extractOneObject - handles escaped quotes in strings', (t) => {
  const input = '{"quote":"He said \\"hello\\""}'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.quote, 'He said "hello"')
  t.is(result.value.remainder, '')
})

test('extractOneObject - handles complex RLStats UpdateState event', (t) => {
  const input = JSON.stringify({
    Event: 'UpdateState',
    Data: {
      MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
      Players: [{
        Name: 'PlayerA',
        PrimaryId: 'Steam|123|0',
        Shortcut: 1,
        TeamNum: 0,
        Score: 125,
        Goals: 1,
        Shots: 2,
        Assists: 0,
        Saves: 1,
        Touches: 14,
        CarTouches: 3,
        Demos: 0,
        bHasCar: true,
        Speed: 1200,
        Boost: 45,
        bBoosting: true,
        bOnGround: true,
        bOnWall: false,
        bPowersliding: false,
        bDemolished: true,
        Attacker: { Name: 'PlayerB', Shortcut: 2, TeamNum: 1 },
        bSupersonic: true
      }],
      Game: {
        Teams: [{ Name: 'Blue', TeamNum: 0, Score: 1, ColorPrimary: '0000FF', ColorSecondary: '0000AA' }],
        TimeSeconds: 180,
        bOvertime: false,
        Frame: 120,
        Elapsed: 50.2,
        Ball: { Speed: 850.5, TeamNum: 0 },
        bReplay: false,
        bHasWinner: true,
        Winner: 'Blue',
        Arena: 'Stadium_P',
        bHasTarget: true,
        Target: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }
      }
    }
  })

  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.Event, 'UpdateState')
  t.is(result.value.parsed.Data.MatchGuid, 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.is(result.value.parsed.Data.Players.length, 1)
  t.is(result.value.parsed.Data.Players[0].Name, 'PlayerA')
  t.is(result.value.parsed.Data.Players[0].PrimaryId, 'Steam|123|0')
  t.is(result.value.parsed.Data.Game.Teams[0].Name, 'Blue')
  t.is(result.value.remainder, '')
})

test('extractOneObject - handles UpdateState event followed by newline', (t) => {
  const input = JSON.stringify({
    Event: 'UpdateState',
    Data: {
      MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
      Players: [{
        Name: 'PlayerA',
        PrimaryId: 'Steam|123|0',
        Shortcut: 1,
        TeamNum: 0,
        Score: 125,
        Goals: 1,
        Shots: 2,
        Assists: 0,
        Saves: 1,
        Touches: 14,
        CarTouches: 3,
        Demos: 0,
        bHasCar: true,
        Speed: 1200,
        Boost: 45,
        bBoosting: true,
        bOnGround: true,
        bOnWall: false,
        bPowersliding: false,
        bDemolished: true,
        Attacker: { Name: 'PlayerB', Shortcut: 2, TeamNum: 1 },
        bSupersonic: true
      }],
      Game: {
        Teams: [{ Name: 'Blue', TeamNum: 0, Score: 1, ColorPrimary: '0000FF', ColorSecondary: '0000AA' }],
        TimeSeconds: 180,
        bOvertime: false,
        Frame: 120,
        Elapsed: 50.2,
        Ball: { Speed: 850.5, TeamNum: 0 },
        bReplay: false,
        bHasWinner: true,
        Winner: 'Blue',
        Arena: 'Stadium_P',
        bHasTarget: true,
        Target: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }
      }
    }
  }) + '\n'

  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.Event, 'UpdateState')
  t.is(result.value.remainder, '\n')
})

test('extractOneObject - returns none for empty string', (t) => {
  t.ok(Option.isNone(extractOneObject('')))
})

test('extractOneObject - returns none for invalid JSON', (t) => {
  t.ok(Option.isNone(extractOneObject('{invalid}')))
})

test('extractOneObject - returns none for string not starting with { or [', (t) => {
  t.ok(Option.isNone(extractOneObject('hello')))
})

test('extractOneObject - handles multiple events in sequence', (t) => {
  const event1 = JSON.stringify({ Event: 'GoalScored', Data: { MatchGuid: 'abc', GoalSpeed: 87.3 } })
  const event2 = JSON.stringify({ Event: 'BallHit', Data: { MatchGuid: 'def', Players: [] } })
  const input = event1 + '\n' + event2

  const result1 = extractOneObject(input)
  t.ok(Option.isSome(result1))
  t.is(result1.value.parsed.Event, 'GoalScored')
  t.is(result1.value.remainder, '\n' + event2)

  const result2 = extractOneObject(result1.value.remainder)
  t.ok(Option.isSome(result2))
  t.is(result2.value.parsed.Event, 'BallHit')
  t.is(result2.value.remainder, '')
})

test('extractOneObject - handles deeply nested objects', (t) => {
  const input = '{"a":{"b":{"c":{"d":{"e":1}}}}}'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.a.b.c.d.e, 1)
  t.is(result.value.remainder, '')
})

test('extractOneObject - handles mixed nested structures', (t) => {
  const input = '{"a":[{"b":{"c":[1,2]}}]}'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.a[0].b.c[1], 2)
  t.is(result.value.remainder, '')
})

test('extractOneObject - handles strings with backslash-brace sequences', (t) => {
  const input = '{"path":"C:\\\\Users\\\\{name}"}'
  const result = extractOneObject(input)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.path, 'C:\\Users\\{name}')
  t.is(result.value.remainder, '')
})

test('extractOneObject - real game data with unicode', (t) => {
  const fixturePath = path.join(__dirname, 'fixtures/real-game-updatestate.json')
  const raw = fs.readFileSync(fixturePath, 'utf8').trim()
  const result = extractOneObject(raw)
  t.ok(Option.isSome(result))
  t.is(result.value.parsed.Event, 'UpdateState')
  t.ok(result.value.parsed.Data.includes('Quixōtic'))
  t.is(result.value.remainder, '')
})
