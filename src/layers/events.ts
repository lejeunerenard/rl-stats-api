import { Context, Effect, Either, Chunk, Option, Layer, Stream, Queue, ParseResult } from 'effect'
import net from 'net'
import { ConnectionService } from './connection.js'
import type { ConnectionLive } from './connection.js'
import { decodeAndParse } from '../lib/json-parse-stream.js'
import { AllEvents } from '../schema/events.js'
type AllEventsType = typeof AllEvents.Type

export interface RLStatsLive {
  readonly parsed: Stream.Stream<Either.Either<AllEventsType, ParseResult.ParseError>>
  readonly socket: Effect.Effect<net.Socket>
  readonly connected: Effect.Effect<void, Error, never>
  readonly closed: Effect.Effect<void, never, never>
}

export class RLStatsService extends Context.Tag('@rlstats/Events')<RLStatsService, RLStatsLive>() {}

export const RLStatsServiceLive = Layer.effect(
  RLStatsService,
  Effect.gen(function* () {
    const connection = yield* ConnectionService
    const socket = yield* connection.socket

    const parsed = Stream.async<Either.Either<AllEventsType, ParseResult.ParseError>>((emit) => {
      let _buffer = ''
      const processChunk = (chunk: Buffer) => {
        _buffer += chunk.toString()
        const { results, remainder } = decodeAndParse(_buffer)
        _buffer = remainder
        for (const result of results) {
          emit(Effect.succeed(Chunk.of(result)))
        }
      }

      const onClose = () => {
        emit(Effect.fail(Option.none()))
      }

      socket.on('data', processChunk)
      socket.on('close', onClose)
    })

    return {
      parsed,
      socket: connection.socket,
      connected: connection.connected,
      closed: connection.closed
    }
  })
)
