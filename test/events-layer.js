const test = require('brittle')
const net = require('net')
const { once } = require('events')
const { Effect, Stream, Layer, Either } = require('effect')
const { RLStatsService, RLStatsServiceLive } = require('../dist/layers/events.js')
const { ConnectionServiceLive } = require('../dist/layers/connection.js')
const { RLStatsConfig } = require('../dist/layers/config.js')
const { setupTest } = require('./helpers/mock-server.js')

function getRLStatsService(port) {
  return Effect.runPromise(
    Effect.provide(RLStatsService, RLStatsServiceLive)
      .pipe(
        Effect.provide(ConnectionServiceLive),
        Effect.provide(Layer.succeed(RLStatsConfig, { port, host: '127.0.0.1' }))
      )
  )
}

test('RLStatsServiceLive emits parsed events', async (t) => {
  const { server, port } = await setupTest(t)

  const collected = []
  const errors = []

  const connectionPromise = once(server, 'connection')

  const service = await getRLStatsService(port)

  Effect.runFork(
    Stream.runForEach(service.parsed, (parsed) => {
      Either.match(parsed, {
        onLeft: (error) => {
          errors.push(error)
        },
        onRight: (event) => {
          collected.push(event)
        }
      })
      return Effect.succeed(undefined)
    })
  )

  const [serverSocket] = await connectionPromise
  t.teardown(() => serverSocket.destroy())

  serverSocket.write(JSON.stringify({
    Event: 'GoalScored',
    Data: {
      MatchGuid: 'abc',
      GoalSpeed: 87.3,
      GoalTime: 127.5,
      ImpactLocation: { X: 0, Y: -2944, Z: 320 },
      Scorer: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
      BallLastTouch: { Player: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }, Speed: 125 }
    }
  }) + '\n')

  // Wait for the event to be collected
  await new Promise(resolve => {
    const check = () => {
      if (collected.length > 0) resolve()
      else setTimeout(check, 10)
    }
    check()
  })

  t.is(collected.length, 1)
  t.is(collected[0].Event, 'GoalScored')
  t.ok(collected[0].Data.MatchGuid === 'abc')
  t.ok(collected[0].Data.GoalSpeed === 87.3)
})

test('RLStatsServiceLive handles chunked data', async (t) => {
  const { server, port } = await setupTest(t)

  const collected = []

  const connectionPromise = once(server, 'connection')

  const service = await getRLStatsService(port)

  Effect.runFork(
    Stream.runForEach(service.parsed, (parsed) => {
      Either.match(parsed, {
        onLeft: () => {},
        onRight: (event) => {
          collected.push(event)
        }
      })
      return Effect.succeed(undefined)
    })
  )

  const [serverSocket] = await connectionPromise
  t.teardown(() => serverSocket.destroy())

  const json = JSON.stringify({
    Event: 'BallHit',
    Data: {
      MatchGuid: 'chunked',
      Players: [{ Name: 'PlayerB', Shortcut: 2, TeamNum: 1 }],
      Ball: { PreHitSpeed: 100, PostHitSpeed: 1450.2, Location: { X: -512, Y: 100, Z: 200 } }
    }
  })

  const chunks = []
  for (let i = 0; i < json.length; i += 15) {
    chunks.push(json.substring(i, i + 15))
  }
  for (const chunk of chunks) {
    serverSocket.write(chunk)
  }

  // Wait for the event to be collected
  await new Promise(resolve => {
    const check = () => {
      if (collected.length > 0) resolve()
      else setTimeout(check, 10)
    }
    check()
  })

  t.is(collected.length, 1)
  t.is(collected[0].Event, 'BallHit')
  t.ok(collected[0].Data.MatchGuid === 'chunked')
})

test('RLStatsServiceLive emits schema errors', async (t) => {
  const { server, port } = await setupTest(t)

  const errors = []

  const connectionPromise = once(server, 'connection')

  const service = await getRLStatsService(port)

  Effect.runFork(
    Stream.runForEach(service.parsed, (parsed) => {
      Either.match(parsed, {
        onLeft: (error) => {
          errors.push(error)
        },
        onRight: () => {}
      })
      return Effect.succeed(undefined)
    })
  )

  const [serverSocket] = await connectionPromise
  t.teardown(() => serverSocket.destroy())

  serverSocket.write(JSON.stringify({
    Event: 'GoalScored',
    Data: {
      MatchGuid: 'abc',
      GoalSpeed: 87.3,
      GoalTime: 127.5,
      ImpactLocation: { X: 0, Y: -2944, Z: 320 },
      Scorer: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
      BallLastTouch: { Player: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }, Speed: 125 },
      badField: true
    }
  }) + '\n')

  // Wait for the error to be collected
  await new Promise(resolve => {
    const check = () => {
      if (errors.length > 0) resolve()
      else setTimeout(check, 10)
    }
    check()
  })

  t.ok(errors.length > 0, 'schema error emitted')
  t.ok(errors[0], 'error object exists')
})

test('RLStatsServiceLive handles multiple events', async (t) => {
  const { server, port } = await setupTest(t)

  const collected = []

  const connectionPromise = once(server, 'connection')

  const service = await getRLStatsService(port)

  Effect.runFork(
    Stream.runForEach(service.parsed, (parsed) => {
      Either.match(parsed, {
        onLeft: () => {},
        onRight: (event) => {
          collected.push(event)
        }
      })
      return Effect.succeed(undefined)
    })
  )

  const [serverSocket] = await connectionPromise
  t.teardown(() => serverSocket.destroy())

  serverSocket.write(JSON.stringify({
    Event: 'GoalScored',
    Data: {
      MatchGuid: 'multi',
      GoalSpeed: 87.3,
      GoalTime: 127.5,
      ImpactLocation: { X: 0, Y: -2944, Z: 320 },
      Scorer: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
      BallLastTouch: { Player: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }, Speed: 125 }
    }
  }) + '\n')
  serverSocket.write(JSON.stringify({
    Event: 'BallHit',
    Data: {
      MatchGuid: 'multi',
      Players: [{ Name: 'PlayerB', Shortcut: 2, TeamNum: 1 }],
      Ball: { PreHitSpeed: 100, PostHitSpeed: 1450.2, Location: { X: -512, Y: 100, Z: 200 } }
    }
  }) + '\n')

  // Wait for both events to be collected
  await new Promise(resolve => {
    const check = () => {
      if (collected.length >= 2) resolve()
      else setTimeout(check, 10)
    }
    check()
  })

  t.is(collected.length, 2)
  t.is(collected[0].Event, 'GoalScored')
  t.is(collected[1].Event, 'BallHit')
})
