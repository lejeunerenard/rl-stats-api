// @ts-nocheck
import { Context, Effect, Layer, Stream } from "effect"
import { PassThrough } from "stream"
import net from "net"
import { RLStatsConfig } from "./config.js"

export interface ConnectionLive {
  readonly socket: Effect<net.Socket>
  readonly connected: Effect<void, Error, never>
  readonly data: Stream.Stream<string, never>
  readonly closed: Effect<void, never>
}

export class ConnectionService extends Context.Tag<ConnectionService, ConnectionLive>()("@rlstats/Connection") {}

export const ConnectionServiceLive = Layer.effect(
  ConnectionService,
  Effect.flatMap(RLStatsConfig, (config) =>
    Effect.sync(() => {
      const socket = net.createConnection(config.port, config.host)
      const passthrough = new PassThrough()

      async function* reader() {
        for await (const chunk of passthrough) {
          yield chunk.toString()
        }
      }

      const data = Stream.fromAsyncIterable(reader())

      const connected = new Promise<void>((resolve, reject) => {
        socket.once("connect", () => resolve())
        socket.once("error", (err) => reject(err))
      })

      const closed = new Promise<void>((resolve) => {
        socket.once("close", () => resolve())
      })

      socket.on("data", (chunk: Buffer) => {
        passthrough.write(chunk)
      })

      socket.on("close", () => {
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
)
