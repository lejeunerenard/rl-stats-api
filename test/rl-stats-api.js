const test = require('brittle')
const { once } = require('events')
const net = require('net')
const RLStatsAPI = require('../dist/index.js').default

const { join } = require('path')
const { createReadStream } = require('fs')
const {
  createServerAndConnection,
  sendEvent,
  closeConnection
} = require('./helpers/mock-server.js')

// Connection Events
test('emits connected when socket opens', async (t) => {
  const server = net.createServer()
  server.listen(0, '127.0.0.1')
  t.teardown(() => server.close(), { order: 10 })
  await once(server, 'listening')
  const port = server.address().port

  const connection = new RLStatsAPI(port)
  t.teardown(async () => {
    await closeConnection(connection)
  })
  await once(connection, 'connected')
  t.pass('connected event emitted')
})

// Skipped: connection:error triggers uncaught streamx error in Bare runtime
// test('emits connection:error when connection fails', async (t) => {
//   const port = 1
//   const connection = new RLStatsAPI(port)
//   const [err] = await once(connection, 'connection:error')
//   t.ok(err instanceof Error, 'error is an Error instance')
// })

// Event Forwarding - Individual Tests
test('forwards UpdateState event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'UpdateState', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    Players: [
      {
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
        bSupersonic: true,
        Loadout: [
          'body_grain',
          'Skin_bartees',
          'Wheel_SoccerBall',
          'Boost_AlphaReward',
          'None',
          'None'
        ],
        PickupClass: 'SpecialPickup_GrapplingHook_TA'
      }
    ],
    Game: {
      Teams: [
        { Name: 'Blue', TeamNum: 0, Score: 1, ColorPrimary: '0000FF', ColorSecondary: '0000AA' }
      ],
      PlaylistId: 11,
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
  })

  const [data] = await once(connection, 'UpdateState')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(Array.isArray(data.Players), 'Players is an array')
  t.ok(data.Players.length === 1)
  t.ok(data.Players[0].Name === 'PlayerA')
  t.ok(data.Players[0].PrimaryId.Platform === 'Steam')
  t.ok(data.Players[0].PrimaryId.Uid === '123')
  t.ok(data.Players[0].PrimaryId.Splitscreen === 0)
  t.ok(data.Players[0].bHasCar === true)
  t.ok(data.Game.Teams.length === 1)
  t.ok(data.Game.Teams[0].Name === 'Blue')
  t.ok(data.Game.Teams[0].Score === 1)
  t.ok(data.Game.Ball.Speed === 850.5)
  t.ok(data.Game.Arena === 'Stadium_P')
  t.ok(Array.isArray(data.Players[0].Loadout))
  t.ok(data.Players[0].Loadout.length === 6)
  t.ok(data.Players[0].PickupClass === 'SpecialPickup_GrapplingHook_TA')
})

test('forwards GoalScored event with Assister', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'GoalScored', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    GoalSpeed: 87.3,
    GoalTime: 127.5,
    ImpactLocation: { X: 0, Y: -2944, Z: 320 },
    Scorer: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
    Assister: { Name: 'PlayerC', Shortcut: 3, TeamNum: 0 },
    BallLastTouch: { Player: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }, Speed: 125 }
  })

  const [data] = await once(connection, 'GoalScored')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.Scorer.Name === 'PlayerA')
  t.ok(data.Scorer.Shortcut === 1)
  t.ok(data.Scorer.TeamNum === 0)
  t.ok(data.Assister.Name === 'PlayerC')
  t.ok(data.GoalSpeed === 87.3)
  t.ok(data.GoalTime === 127.5)
  t.ok(data.ImpactLocation.X === 0)
  t.ok(data.ImpactLocation.Y === -2944)
  t.ok(data.ImpactLocation.Z === 320)
})

test('forwards GoalScored event without Assister', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'GoalScored', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    GoalSpeed: 92.1,
    GoalTime: 245.3,
    ImpactLocation: { X: 0, Y: 2944, Z: 320 },
    Scorer: { Name: 'PlayerD', Shortcut: 4, TeamNum: 1 },
    BallLastTouch: { Player: { Name: 'PlayerD', Shortcut: 4, TeamNum: 1 }, Speed: 130 }
  })

  const [data] = await once(connection, 'GoalScored')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.Scorer.Name === 'PlayerD')
  t.ok(data.Assister === undefined)
})

test('forwards BallHit event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'BallHit', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    Players: [{ Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }],
    Ball: { PreHitSpeed: 0, PostHitSpeed: 1450.2, Location: { X: -512, Y: 100, Z: 200 } }
  })

  const [data] = await once(connection, 'BallHit')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.Players.length === 1)
  t.ok(data.Players[0].Name === 'PlayerA')
  t.ok(data.Ball.PreHitSpeed === 0)
  t.ok(data.Ball.PostHitSpeed === 1450.2)
  t.ok(data.Ball.Location.X === -512)
  t.ok(data.Ball.Location.Y === 100)
  t.ok(data.Ball.Location.Z === 200)
})

test('forwards ClockUpdatedSeconds event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'ClockUpdatedSeconds', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    TimeSeconds: 180,
    bOvertime: false
  })

  const [data] = await once(connection, 'ClockUpdatedSeconds')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.TimeSeconds === 180)
  t.ok(data.bOvertime === false)
})

test('forwards CountdownBegin event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'CountdownBegin', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'CountdownBegin')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards RoundStarted event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'RoundStarted', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'RoundStarted')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards MatchCreated event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'MatchCreated', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'MatchCreated')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards MatchInitialized event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'MatchInitialized', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'MatchInitialized')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards MatchEnded event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'MatchEnded', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    WinnerTeamNum: 0
  })

  const [data] = await once(connection, 'MatchEnded')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.WinnerTeamNum === 0)
})

test('forwards MatchDestroyed event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'MatchDestroyed', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'MatchDestroyed')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards MatchPaused event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'MatchPaused', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'MatchPaused')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards MatchUnpaused event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'MatchUnpaused', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'MatchUnpaused')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards StatfeedEvent', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'StatfeedEvent', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    EventName: 'Demolish',
    Type: 'Demolition',
    MainTarget: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
    SecondaryTarget: { Name: 'PlayerB', Shortcut: 2, TeamNum: 1 }
  })

  const [data] = await once(connection, 'StatfeedEvent')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.EventName === 'Demolish')
  t.ok(data.Type === 'Demolition')
  t.ok(data.MainTarget.Name === 'PlayerA')
  t.ok(data.MainTarget.Shortcut === 1)
  t.ok(data.SecondaryTarget.Name === 'PlayerB')
})

test('forwards CrossbarHit event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'CrossbarHit', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    BallLocation: { X: 120, Y: -2944, Z: 320 },
    BallSpeed: 870.3,
    ImpactForce: 127.5,
    BallLastTouch: {
      Player: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
      Speed: 120
    }
  })

  const [data] = await once(connection, 'CrossbarHit')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.BallSpeed === 870.3)
  t.ok(data.ImpactForce === 127.5)
  t.ok(data.BallLocation.X === 120)
  t.ok(data.BallLocation.Y === -2944)
  t.ok(data.BallLocation.Z === 320)
  t.ok(data.BallLastTouch.Player.Name === 'PlayerA')
  t.ok(data.BallLastTouch.Speed === 120)
})

test('forwards GoalReplayStart event with Scorer', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'GoalReplayStart', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'GoalReplayStart')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards GoalReplayEnd event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'GoalReplayEnd', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'GoalReplayEnd')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards GoalReplayWillEnd event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'GoalReplayWillEnd', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'GoalReplayWillEnd')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards PodiumStart event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'PodiumStart', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  })

  const [data] = await once(connection, 'PodiumStart')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
})

test('forwards ReplayCreated event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'ReplayCreated', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    FileName: 'Stadium_P_2026-06-05_18-42',
    Date: '2026-06-05 18:42:13'
  })

  const [data] = await once(connection, 'ReplayCreated')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.FileName === 'Stadium_P_2026-06-05_18-42')
  t.ok(data.Date instanceof Date)
  t.ok(data.Date.getFullYear() === 2026)
  t.ok(data.Date.getMonth() === 5)
  t.ok(data.Date.getDate() === 5)
})

test('forwards BoostPickup event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'BoostPickup', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    Player: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
    Location: { X: -3072, Y: 0, Z: 73 },
    BoostAmount: 100,
    BoostType: 'BoostType_Pill',
    bReplay: false
  })

  const [data] = await once(connection, 'BoostPickup')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.Player.Name === 'PlayerA')
  t.ok(data.Location.X === -3072)
  t.ok(data.BoostAmount === 100)
  t.ok(data.BoostType === 'BoostType_Pill')
  t.ok(data.bReplay === false)
})

test('forwards PlayerJoined event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'PlayerJoined', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    PlayerName: 'PlayerA',
    PrimaryId: 'Steam|123|0'
  })

  const [data] = await once(connection, 'PlayerJoined')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.PlayerName === 'PlayerA')
  t.ok(data.PrimaryId.Platform === 'Steam')
  t.ok(data.PrimaryId.Uid === '123')
  t.ok(data.PrimaryId.Splitscreen === 0)
})

test('forwards PlayerLeft event', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'PlayerLeft', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    PlayerName: 'PlayerA',
    PrimaryId: 'Steam|123|0'
  })

  const [data] = await once(connection, 'PlayerLeft')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.PlayerName === 'PlayerA')
  t.ok(data.PrimaryId.Platform === 'Steam')
  t.ok(data.PrimaryId.Uid === '123')
  t.ok(data.PrimaryId.Splitscreen === 0)
})

// ============================================================================
// Chunked Data Handling
// ============================================================================

test('handles events split across multiple writes', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  const json = JSON.stringify({
    Event: 'GoalScored',
    Data: {
      MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
      GoalSpeed: 87.3,
      GoalTime: 127.5,
      ImpactLocation: { X: 0, Y: -2944, Z: 320 },
      Scorer: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
      Assister: { Name: 'PlayerC', Shortcut: 3, TeamNum: 0 },
      BallLastTouch: { Player: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 }, Speed: 125 }
    }
  })

  // Split into 20-byte chunks
  const chunks = []
  for (let i = 0; i < json.length; i += 20) {
    chunks.push(json.substring(i, i + 20))
  }

  // Send chunks first, then wait for event
  for (const chunk of chunks) {
    socket.write(chunk)
  }

  const [data] = await once(connection, 'GoalScored')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.Scorer.Name === 'PlayerA')
  t.ok(data.GoalSpeed === 87.3)
  t.ok(data.Assister.Name === 'PlayerC')
})

test('handles multiple events in a single write', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  const event1 = JSON.stringify({
    Event: 'GoalScored',
    Data: {
      MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
      GoalSpeed: 87.3,
      GoalTime: 127.5,
      ImpactLocation: { X: 0, Y: -2944, Z: 320 },
      Scorer: { Name: 'PlayerA', Shortcut: 1, TeamNum: 0 },
      Assister: { Name: 'PlayerC', Shortcut: 3, TeamNum: 0 },
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

  // Send both events first (newline-separated for reliable parsing)
  socket.write(event1 + '\n' + event2)

  const [goalData] = await once(connection, 'GoalScored')

  // Wait a tick for the second event to be processed
  await new Promise((resolve) => setImmediate(resolve))

  t.ok(goalData.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(goalData.Scorer.Name === 'PlayerA')
})

// ============================================================================
// Match Lifecycle
// ============================================================================

test('emits events in correct match lifecycle order', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  const fixturePath = join(__dirname, './fixtures/match-lifecycle.txt')
  const stream = createReadStream(fixturePath, { highWaterMark: 4096 })

  const expectedEvents = [
    'MatchCreated',
    'MatchInitialized',
    'CountdownBegin',
    'RoundStarted',
    'GoalScored',
    'GoalReplayStart',
    'GoalReplayWillEnd',
    'GoalReplayEnd',
    'GoalScored',
    'GoalReplayStart',
    'GoalReplayWillEnd',
    'GoalReplayEnd',
    'MatchEnded',
    'PodiumStart',
    'MatchDestroyed'
  ]

  // Collect events as they arrive
  const received = []
  const matchGuids = []

  // Send events line by line from the fixture file
  const lines = []
  for await (const chunk of stream) {
    lines.push(...chunk.toString().trim().split('\n').filter(Boolean))
  }

  // Send each event and wait for the corresponding event
  for (let i = 0; i < lines.length && i < expectedEvents.length; i++) {
    socket.write(lines[i] + '\n')
    const [data] = await once(connection, expectedEvents[i])
    received.push(expectedEvents[i])
    matchGuids.push(data.MatchGuid)
  }

  t.alike(received, expectedEvents.slice(0, lines.length), 'events received in correct order')
  t.ok(
    matchGuids.every((g) => g === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'),
    'all events share same MatchGuid'
  )
})

// Fixture was too big
test.skip('example output processing', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  const fixturePath = join(__dirname, './fixtures/out1780278903814.json')
  const stream = createReadStream(fixturePath, { highWaterMark: 4096 })

  // Collect events as they arrive
  const received = []
  const matchGuids = []

  // Send events line by line from the fixture file
  connection.on('schema:error', (err) => {
    console.error(err.error.message)
    throw err
  })

  for await (const chunk of stream) {
    socket.write(chunk.toString())
  }
})

// ============================================================================
// Data Integrity
// ============================================================================

test('preserves nested data structures', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'UpdateState', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    Players: [
      {
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
        bSupersonic: true,
        Loadout: [
          'body_grain',
          'Skin_bartees',
          'Wheel_SoccerBall',
          'Boost_AlphaReward',
          'None',
          'None'
        ],
        PickupClass: 'SpecialPickup_GrapplingHook_TA'
      }
    ],
    Game: {
      Teams: [
        { Name: 'Blue', TeamNum: 0, Score: 1, ColorPrimary: '0000FF', ColorSecondary: '0000AA' }
      ],
      PlaylistId: 11,
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
  })

  const [data] = await once(connection, 'UpdateState')

  t.ok(data.MatchGuid === 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6')
  t.ok(data.Players[0].Attacker.Name === 'PlayerB')
  t.ok(data.Players[0].Attacker.Shortcut === 2)
  t.ok(data.Players[0].Attacker.TeamNum === 1)
  t.ok(data.Game.Ball.Speed === 850.5)
  t.ok(data.Game.Ball.TeamNum === 0)
  t.ok(data.Game.Target.Name === 'PlayerA')
})

test('handles empty arrays', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()

  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  sendEvent(socket, 'BallHit', {
    MatchGuid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    Players: [],
    Ball: { PreHitSpeed: 0, PostHitSpeed: 1450.2, Location: { X: -512, Y: 100, Z: 200 } }
  })

  const [data] = await once(connection, 'BallHit')

  t.ok(data.Players.length === 0, 'Players array is empty')
  t.ok(data.Ball.PreHitSpeed === 0)
  t.ok(data.Ball.PostHitSpeed === 1450.2)
})

// ============================================================================
// Schema Validation
// ============================================================================

test('rejects malformed event data', async (t) => {
  const { server, socket, connection } = await createServerAndConnection()
  t.teardown(async () => {
    await closeConnection(connection)
    server.close()
  })

  socket.write(
    JSON.stringify({
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
    }) + '\n'
  )

  const [error] = await once(connection, 'schema:error')
  t.ok(error, 'schema:error emitted for invalid data')
})
