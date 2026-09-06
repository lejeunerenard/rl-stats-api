import { Chunk, Channel, Context, Effect, Either, Layer, ParseResult } from 'effect'
import { ConnectionService } from './connection.js'
import type { SocketError } from '@effect/platform/Socket'
import * as Socket from '@effect/platform/Socket'
import { decodeAndParse } from '../lib/json-parse-stream.js'
import { AllEvents } from '../schema/events.js'
type AllEventsType = typeof AllEvents.Type

export interface RLStatsLive {
  readonly parsed: Channel.Channel<
    Chunk.Chunk<Either.Either<AllEventsType, ParseResult.ParseError>>,
    Chunk.Chunk<string | Uint8Array | Socket.CloseEvent>,
    SocketError,
    SocketError
  >
  readonly connected: Effect.Effect<void, SocketError, never>
}

export class RLStatsService extends Context.Tag('@rlstats/Events')<RLStatsService, RLStatsLive>() {}

const decodeString = <IE, Done>() => {
  let _buffer = ''
  const loop: Channel.Channel<
    Chunk.Chunk<Either.Either<AllEventsType, ParseResult.ParseError>>,
    Chunk.Chunk<string>,
    IE,
    IE,
    Done,
    Done,
    never
  > = Channel.readWithCause({
    onInput: (input) =>
      Channel.zipRight(
        Channel.write(
          Chunk.flatMap(input, (str) => {
            _buffer += str
            const { results, remainder } = decodeAndParse(_buffer)
            _buffer = remainder
            return Chunk.fromIterable(results)
          })
        ),
        loop
      ),
    onFailure: Channel.failCause,
    onDone: Channel.succeed
  })
  return loop
}

export const RLStatsServiceLive = Layer.effect(
  RLStatsService,
  Effect.gen(function* () {
    const connection = yield* ConnectionService

    const readChannel = Socket.toChannelMap<SocketError, string>(connection.socket, (data) =>
      data.toString()
    )

    const parsed = Channel.pipeTo(readChannel, decodeString())

    return {
      parsed,
      connected: connection.connected
    }
  })
)
