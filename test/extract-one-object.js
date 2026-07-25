const test = require('brittle')

function extractOneObject(working) {
  if (working.length === 0) return null

  let start = 0
  while (start < working.length && /\s/.test(working[start])) {
    start++
  }
  if (start === working.length) return null

  const startChar = working[start]
  const endChar = startChar === '[' ? ']' : startChar === '{' ? '}' : null
  if (!endChar) return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < working.length; i++) {
    const char = working[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === '\\' && inString) {
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === '{' || char === '[') {
      depth++
    } else if (char === '}' || char === ']') {
      depth--
      if (depth === 0) {
        const str = working.substring(0, i + 1)
        try {
          const obj = JSON.parse(str)
          return { parsed: obj, remainder: working.substring(i + 1) }
        } catch {
          return null
        }
      }
    }
  }

  return null
}

test('extractOneObject - parses simple object', (t) => {
  const input = '{"foo":"bar"}'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.is(result.parsed.foo, 'bar')
  t.is(result.remainder, '')
})

test('extractOneObject - returns remainder after parsed object', (t) => {
  const input = '{"foo":"bar"}{"baz":"qux"}'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.is(result.parsed.foo, 'bar')
  t.is(result.remainder, '{"baz":"qux"}')
})

test('extractOneObject - handles nested objects', (t) => {
  const input = '{"a":{"b":{"c":1}}}'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.is(result.parsed.a.b.c, 1)
  t.is(result.remainder, '')
})

test('extractOneObject - handles arrays', (t) => {
  const input = '[1,2,3]'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.alike(result.parsed, [1, 2, 3])
  t.is(result.remainder, '')
})

test('extractOneObject - handles objects with arrays', (t) => {
  const input = '{"items":[1,2,3]}'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.alike(result.parsed.items, [1, 2, 3])
  t.is(result.remainder, '')
})

test('extractOneObject - handles braces inside strings', (t) => {
  const input = '{"message":"Use { and } for objects"}'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.is(result.parsed.message, 'Use { and } for objects')
  t.is(result.remainder, '')
})

test('extractOneObject - handles brackets inside strings', (t) => {
  const input = '{"list":"[1,2,3]"}'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.is(result.parsed.list, '[1,2,3]')
  t.is(result.remainder, '')
})

test('extractOneObject - handles escaped quotes in strings', (t) => {
  const input = '{"quote":"He said \\"hello\\""}'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.is(result.parsed.quote, 'He said "hello"')
  t.is(result.remainder, '')
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
  t.ok(result !== null)
  t.is(result.parsed.Event, 'UpdateState')
  t.is(result.parsed.Data.MatchGuid, 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.is(result.parsed.Data.Players.length, 1)
  t.is(result.parsed.Data.Players[0].Name, 'PlayerA')
  t.is(result.parsed.Data.Game.Teams[0].Name, 'Blue')
  t.is(result.remainder, '')
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
  t.ok(result !== null)
  t.is(result.parsed.Event, 'UpdateState')
  t.is(result.remainder, '\n')
})

test('extractOneObject - returns null for empty string', (t) => {
  t.is(extractOneObject(''), null)
})

test('extractOneObject - returns null for invalid JSON', (t) => {
  t.is(extractOneObject('{invalid}'), null)
})

test('extractOneObject - returns null for string not starting with { or [', (t) => {
  t.is(extractOneObject('hello'), null)
})

test('extractOneObject - handles multiple events in sequence', (t) => {
  const event1 = JSON.stringify({ Event: 'GoalScored', Data: { MatchGuid: 'abc', GoalSpeed: 87.3 } })
  const event2 = JSON.stringify({ Event: 'BallHit', Data: { MatchGuid: 'def', Players: [] } })
  const input = event1 + '\n' + event2

  const result1 = extractOneObject(input)
  t.ok(result1 !== null)
  t.is(result1.parsed.Event, 'GoalScored')
  t.is(result1.remainder, '\n' + event2)

  const result2 = extractOneObject(result1.remainder)
  t.ok(result2 !== null)
  t.is(result2.parsed.Event, 'BallHit')
  t.is(result2.remainder, '')
})

test('extractOneObject - handles deeply nested objects', (t) => {
  const input = '{"a":{"b":{"c":{"d":{"e":1}}}}}'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.is(result.parsed.a.b.c.d.e, 1)
  t.is(result.remainder, '')
})

test('extractOneObject - handles mixed nested structures', (t) => {
  const input = '{"a":[{"b":{"c":[1,2]}}]}'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.is(result.parsed.a[0].b.c[1], 2)
  t.is(result.remainder, '')
})

test('extractOneObject - handles strings with backslash-brace sequences', (t) => {
  const input = '{"path":"C:\\\\Users\\\\{name}"}'
  const result = extractOneObject(input)
  t.ok(result !== null)
  t.is(result.parsed.path, 'C:\\Users\\{name}')
  t.is(result.remainder, '')
})
