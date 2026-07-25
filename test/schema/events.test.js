require("bare-encoding/global") // Necessary for `effect`
const test = require('brittle')
const fs = require('fs')
const path = require('path')
const { decodeEventStrict } = require('../../dist/schema/decode.js')
const { Exit, Effect } = require('effect')

test('UpdateStateSchema validates fixture data', async (t) => {
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/update-state-simple.json'), 'utf8'))
  const effect = decodeEventStrict(fixture)
  const result = Effect.runSyncExit(effect)
  t.ok(Exit.isSuccess(result), 'fixture validates against UpdateStateSchema')
})

test('Match lifecycle fixture events all validate', async (t) => {
  const lines = fs.readFileSync(path.join(__dirname, '../fixtures/match-lifecycle.txt'), 'utf8').trim().split('\n')
  for (const line of lines) {
    const raw = JSON.parse(line)
    const effect = decodeEventStrict(raw)
    const result = Effect.runSyncExit(effect)
    t.ok(Exit.isSuccess(result), `event "${raw.Event}" validates`)
  }
})

test('Schema rejects unknown fields (strict mode)', async (t) => {
  const input = {
    Event: 'GoalScored',
    Data: {
      MatchGuid: 'abc123',
      GoalSpeed: 87.3,
      GoalTime: 127.5,
      ImpactLocation: { X: 0, Y: -2944, Z: 320 },
      Scorer: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
      BallLastTouch: { Player: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }, Speed: 125 },
      badField: true
    }
  }
  const effect = decodeEventStrict(input)
  const result = Effect.runSyncExit(effect)
  t.ok(Exit.isFailure(result), 'unknown fields are rejected')
})
