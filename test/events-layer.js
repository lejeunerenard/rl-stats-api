const test = require('brittle')
const net = require('net')
const { once } = require('events')
const { Effect, Stream, Layer } = require('effect')
const { RLStatsService, RLStatsServiceLive } = require('../dist/layers/events.js')
const { ConnectionServiceLive } = require('../dist/layers/connection.js')
const { RLStatsConfig } = require('../dist/layers/config.js')

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
  const server = net.createServer()
  server.listen(0, '127.0.0.1')
  t.teardown(() => server.close())
  await once(server, 'listening')
  const port = server.address().port

  const collected = []
  const errors = []

  const connectionPromise = once(server, 'connection')

  const service = await getRLStatsService(port)

  const fiber = Effect.runFork(
    Stream.runForEach(service.parsed, (parsed) => {
      if (parsed.type === 'event') {
        collected.push(parsed)
      } else {
        errors.push(parsed)
      }
      return Effect.succeed(undefined)
    })
  )

  await new Promise(resolve => setTimeout(resolve, 100))

  const [serverSocket] = await connectionPromise

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

  // TODO refactor these timeouts out
  await new Promise(resolve => setTimeout(resolve, 500))

  t.is(collected.length, 1)
  t.is(collected[0].event, 'GoalScored')
  t.ok(collected[0].data.MatchGuid === 'abc')
  t.ok(collected[0].data.GoalSpeed === 87.3)
})

test('RLStatsServiceLive handles chunked data', async (t) => {
  const server = net.createServer()
  server.listen(0, '127.0.0.1')
  t.teardown(() => server.close())
  await once(server, 'listening')
  const port = server.address().port

  const collected = []

  const connectionPromise = once(server, 'connection')

  const service = await getRLStatsService(port)

  const fiber = Effect.runFork(
    Stream.runForEach(service.parsed, (parsed) => {
      if (parsed.type === 'event') {
        collected.push(parsed)
      }
      return Effect.succeed(undefined)
    })
  )

  await new Promise(resolve => setTimeout(resolve, 100))

  const [serverSocket] = await connectionPromise

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

  await new Promise(resolve => setTimeout(resolve, 500))

  t.is(collected.length, 1)
  t.is(collected[0].event, 'BallHit')
  t.ok(collected[0].data.MatchGuid === 'chunked')
})

test('RLStatsServiceLive emits schema errors', async (t) => {
  const server = net.createServer()
  server.listen(0, '127.0.0.1')
  t.teardown(() => server.close())
  await once(server, 'listening')
  const port = server.address().port

  const errors = []

  const connectionPromise = once(server, 'connection')

  const service = await getRLStatsService(port)

  const fiber = Effect.runFork(
    Stream.runForEach(service.parsed, (parsed) => {
      if (parsed.type === 'error') {
        errors.push(parsed)
      }
      return Effect.succeed(undefined)
    })
  )

  await new Promise(resolve => setTimeout(resolve, 100))

  const [serverSocket] = await connectionPromise

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

  await new Promise(resolve => setTimeout(resolve, 500))

  t.ok(errors.length > 0, 'schema error emitted')
  t.ok(errors[0].error, 'error object exists')
})

test('RLStatsServiceLive handles multiple events', async (t) => {
  const server = net.createServer()
  server.listen(0, '127.0.0.1')
  t.teardown(() => server.close())
  await once(server, 'listening')
  const port = server.address().port

  const collected = []

  const connectionPromise = once(server, 'connection')

  const service = await getRLStatsService(port)

  const fiber = Effect.runFork(
    Stream.runForEach(service.parsed, (parsed) => {
      if (parsed.type === 'event') {
        collected.push(parsed)
      }
      return Effect.succeed(undefined)
    })
  )

  await new Promise(resolve => setTimeout(resolve, 100))

  const [serverSocket] = await connectionPromise

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

  await new Promise(resolve => setTimeout(resolve, 500))

  t.is(collected.length, 2)
  t.is(collected[0].event, 'GoalScored')
  t.is(collected[1].event, 'BallHit')
})
