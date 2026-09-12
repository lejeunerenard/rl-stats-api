import 'bare-encoding/global'

import { header, command, flag } from 'paparam'
import {
  Console,
  Cause,
  Exit,
  Effect,
  Either,
  Stream,
  Schedule,
  Layer,
  ParseResult,
  Queue
} from 'effect'
import { RLStatsService, RLStatsServiceLive } from './layers/events.js'
import { ConnectionServiceLive } from './layers/connection.js'
import { RLStatsConfig } from './layers/config.js'
import type { AllEventsType } from './schema/events.js'

const cmd = command(
  'rl-stats-api-cli',
  header('An app to collect data from the Stats API built into Rocket League'),
  flag('--port|-p [port]', 'Port for the Stats API websocket server'),
  flag('--host [host]', 'Host for the Stats API websocket server'),
  async (cmd) => {
    const port = Number(cmd.flags.port) || 49123
    const host = cmd.flags.host || '127.0.0.1'

    const parsedToLog = (parsed: Either.Either<AllEventsType, ParseResult.ParseError>) =>
      Either.match(parsed, {
        onLeft: (error) => {
          return Console.error('schema error:', error)
          // TODO console.error('raw:', parsed.raw)
        },
        onRight: ({ Event, Data }) => {
          const json = JSON.stringify(Data, null, 2)
          if (Event === 'UpdateState') {
            return Console.log('UpdateState', json)
          } else if (Event === 'GoalScored') {
            return Console.log('GoalScored', json)
          } else if (Event === 'BallHit') {
            return Console.log('BallHit', json)
          }
          return Effect.void
        }
      })

    const program = Effect.gen(function* () {
      const requests = yield* Queue.unbounded<string>()
      const { parsed } = yield* RLStatsService

      yield* Stream.fromQueue(requests).pipe(
        Stream.pipeThroughChannel(parsed),
        Stream.runForEach(parsedToLog)
      )
    })

    const connectionLayer = ConnectionServiceLive.pipe(
      Layer.provide(Layer.succeed(RLStatsConfig, { port, host }))
    )
    const rlStatsLayer = RLStatsServiceLive.pipe(Layer.provide(connectionLayer))

    const re = await Effect.runPromiseExit(
      program.pipe(Effect.provide(rlStatsLayer), Effect.retry(Schedule.spaced('1 second')))
    )
    console.log(
      Exit.match(re, {
        onFailure: (cause) => `Exited with failure state: ${Cause.pretty(cause)}`,
        onSuccess: (value) => `Exited with success value: ${value}`
      })
    )
  }
)

cmd.parse()
