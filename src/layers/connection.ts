import { Context, Effect, Layer, Stream } from 'effect'
import { PassThrough } from 'stream'
import net from 'net'
import { RLStatsConfig } from './config.js'

export interface ConnectionLive {
  readonly socket: Effect.Effect<net.Socket>
  readonly connected: Effect.Effect<void, Error, never>
  readonly data: Stream.Stream<string, unknown, never>
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
    const passthrough = new PassThrough()

    async function* reader() {
      for await (const chunk of passthrough) {
        yield chunk.toString()
      }
    }

    const data = Stream.fromAsyncIterable(reader(), () => 'stream-error')

    const connected = new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve())
      socket.once('error', (err) => reject(err))
    })

    const closed = new Promise<void>((resolve) => {
      socket.once('close', () => resolve())
    })

    socket.on('data', (chunk: Buffer) => {
      passthrough.write(chunk)
    })

    socket.on('close', () => {
      passthrough.end()
    })

    return {
      socket: Effect.succeed(socket),
      connected: Effect.promise(() => connected),
      data,
      closed: Effect.promise(() => closed)
    }
  })
)
