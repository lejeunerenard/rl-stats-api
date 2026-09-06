import { Chunk, Context, Data, Effect, Layer, Option, Stream } from 'effect'
import net from 'net'
import { RLStatsConfig } from './config.js'

export class ConnectionRefused extends Data.TaggedError('ConnectionRefused')<{}> {}

export interface ConnectionLive {
  readonly socket: Effect.Effect<net.Socket>
  readonly connected: Effect.Effect<void, Error, never>
  readonly data: Stream.Stream<string, ConnectionRefused, never>
  readonly closed: Effect.Effect<void, never, never>
}

export class ConnectionService extends Context.Tag('@rlstats/Connection')<
  ConnectionService,
  ConnectionLive
>() {}

export const ConnectionServiceLive = Layer.effect(
  ConnectionService,
  Effect.gen(function* () {
    const { port, host } = yield* RLStatsConfig

    const socket = net.createConnection(port, host)

    const data = Stream.async<string, ConnectionRefused>((emit) => {
      let connected = false
      socket.on('connect', () => (connected = true))
      socket.on('data', (chunk) => {
        emit(Effect.succeed(Chunk.of(chunk.toString())))
      })
      socket.on('close', () => {
        if (connected) emit(Effect.fail(Option.none()))
        else emit(Effect.fail(Option.some(new ConnectionRefused())))
      })
      return Effect.void
    })

    const connected = Effect.async<void, Error>((resume) => {
      const connect = () => {
        socket.off('error', connectionFailed)
        socket.off('close', connectionFailed)
        return resume(Effect.void)
      }
      const connectionFailed = (err: Error) => {
        socket.off('connect', connect)
        socket.off('error', connectionFailed)
        socket.off('close', connectionFailed)
        return resume(Effect.fail(err))
      }
      socket.once('connect', connect)
      socket.once('error', connectionFailed)
      socket.once('close', connectionFailed)
    })

    const closed = Effect.async((resume) => {
      socket.once('close', () => resume(Effect.void))
    })

    return {
      socket: Effect.succeed(socket),
      connected,
      data,
      closed
    }
  })
)
