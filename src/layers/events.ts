import { Context, Effect, Either, Layer, Stream, ParseResult } from 'effect'
import net from 'net'
import { ConnectionService, ConnectionRefused } from './connection.js'
import { decodeAndParse } from '../lib/json-parse-stream.js'
import { AllEvents } from '../schema/events.js'
type AllEventsType = typeof AllEvents.Type

export interface RLStatsLive {
  readonly parsed: Stream.Stream<Either.Either<AllEventsType, ParseResult.ParseError>, ConnectionRefused>
  readonly socket: Effect.Effect<net.Socket>
  readonly connected: Effect.Effect<void, Error, never>
  readonly closed: Effect.Effect<void, never, never>
}

export class RLStatsService extends Context.Tag('@rlstats/Events')<RLStatsService, RLStatsLive>() {}

export const RLStatsServiceLive = Layer.effect(
  RLStatsService,
  Effect.gen(function* () {
    const connection = yield* ConnectionService

    let _buffer = ''

    const parsed = Stream.flatMap(connection.data, (chunk) => {
      _buffer += chunk
      const { results, remainder } = decodeAndParse(_buffer)
      _buffer = remainder
      return Stream.fromIterable(results)
    })

    return {
      parsed,
      socket: connection.socket,
      connected: connection.connected,
      closed: connection.closed
    }
  })
)
