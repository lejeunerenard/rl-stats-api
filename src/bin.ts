// @ts-nocheck
import "bare-encoding/global"

import { header, command, flag } from 'paparam'
import { Effect, Stream, Layer } from 'effect'
import { RLStatsService, RLStatsServiceLive } from './layers/events.js'
import { ConnectionServiceLive } from './layers/connection.js'
import { RLStatsConfig } from './layers/config.js'

const cmd = command(
  'rl-stats-api-cli',
  header('An app to collect data from the Stats API built into Rocket League'),
  flag('--port|-p [port]', 'Port for the Stats API websocket server'),
  flag('--host [host]', 'Host for the Stats API websocket server'),
  async (cmd) => {
    const port = Number(cmd.flags.port) || 49123
    const host = cmd.flags.host || '127.0.0.1'

    const service = await Effect.runPromise(
      Effect.provide(RLStatsService, RLStatsServiceLive)
        .pipe(
          Effect.provide(ConnectionServiceLive),
          Effect.provide(Layer.succeed(RLStatsConfig, { port, host }))
        )
    )

    Effect.runFork(
      Stream.runForEach(service.parsed, (parsed) => {
        if (parsed.type === 'event') {
          if (parsed.event === 'UpdateState') {
            console.log('UpdateState', JSON.stringify(parsed.data, null, 2))
          } else if (parsed.event === 'GoalScored') {
            console.log('GoalScored', JSON.stringify(parsed.data, null, 2))
          } else if (parsed.event === 'BallHit') {
            console.log('BallHit', JSON.stringify(parsed.data, null, 2))
          }
        } else {
          console.error('schema error:', parsed.error)
          console.error('raw:', parsed.raw)
        }
        return Effect.succeed(undefined)
      })
    )
  }
)

cmd.parse()
