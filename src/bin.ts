import 'bare-encoding/global'

import { header, command, flag } from 'paparam'
import { Effect, Either, Stream, Layer, ParseResult } from 'effect'
import { RLStatsService, RLStatsServiceLive } from './layers/events.js'
import { ConnectionServiceLive } from './layers/connection.js'
import { RLStatsConfig } from './layers/config.js'
import type { AllEventsType } from './schema/events.js'

interface SchemaFailure {
  type: 'error'
  error: unknown
  raw: string
}

const cmd = command(
  'rl-stats-api-cli',
  header('An app to collect data from the Stats API built into Rocket League'),
  flag('--port|-p [port]', 'Port for the Stats API websocket server'),
  flag('--host [host]', 'Host for the Stats API websocket server'),
  async (cmd) => {
    const port = Number(cmd.flags.port) || 49123
    const host = cmd.flags.host || '127.0.0.1'

    const service = await Effect.runPromise(
      Effect.provide(RLStatsService, RLStatsServiceLive).pipe(
        Effect.provide(ConnectionServiceLive),
        Effect.provide(Layer.succeed(RLStatsConfig, { port, host }))
      )
    )

    Effect.runFork(
      Stream.runForEach(
        service.parsed,
        (parsed: Either.Either<AllEventsType, ParseResult.ParseError>) => {
          Either.match(parsed, {
            onLeft: (error) => {
              console.error('schema error:', error)
              // TODO console.error('raw:', parsed.raw)
            },
            onRight: ({ Event, Data }) => {
              const json = JSON.stringify(Data, null, 2)
              if (Event === 'UpdateState') {
                console.log('UpdateState', json)
              } else if (Event === 'GoalScored') {
                console.log('GoalScored', json)
              } else if (Event === 'BallHit') {
                console.log('BallHit', json)
              }
            }
          })
          return Effect.succeed(undefined)
        }
      )
    )
  }
)

cmd.parse()
