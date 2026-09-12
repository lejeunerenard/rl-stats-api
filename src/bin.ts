import 'bare-encoding/global'

import { header, command, flag } from 'paparam'
import { Channel, Chunk, Console, Effect, Either, Stream, Layer, ParseResult, Scope } from 'effect'
// import type { SocketError } from '@effect/platform/Socket'
import { RLStatsService, RLStatsServiceLive } from './layers/events.js'
import { ConnectionServiceLive } from './layers/connection.js'
import { RLStatsConfig } from './layers/config.js'
import type { AllEventsType } from './schema/events.js'

function channelToStream<OutElemInner, InElem, OutErr, InErr, OutDone, InDone, Env>(
  channel: Channel.Channel<Chunk.Chunk<OutElemInner>, InElem, OutErr, InErr, OutDone, InDone, Env>
): Stream.Stream<OutElemInner, OutErr, Env> {
  return Stream.unwrapScoped(
    Effect.flatMap(Scope.make(), (scope) =>
      Effect.flatMap(Channel.toPullIn(channel, scope), (pull) => {
        const loop = (): Stream.Stream<OutElemInner, OutErr, Env> =>
          Stream.unwrap(
            Effect.flatMap(pull, (result) => {
              if (Either.isLeft(result)) {
                return Stream.fromIterable(Chunk.flatten(result.left)).pipe(Stream.concat(loop()))
              } else {
                return Stream.empty
              }
            })
          )
        return loop()
      })
    )
  )
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

    Effect.runFork(Stream.runForEach(channelToStream(service.parsed), parsedToLog))
  }
)

cmd.parse()
