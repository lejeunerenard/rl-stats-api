// @ts-nocheck
import { Context, Effect, Layer } from "effect"
import net from "net"
import { RLStatsConfig } from "./config.js"

export interface ConnectionService {
  readonly socket: net.Socket
  readonly connected: Effect<void, Error, never>
}
export const ConnectionService = Context.Tag<ConnectionService>()

export const ConnectionLive = Layer.effect(
  ConnectionService,
  Effect.acquireRelease(
    Effect.gen(function* () {
      const { port, host } = yield* RLStatsConfig
      const socket = yield* Effect.sync(() => net.createConnection(port, host))
      const connected = new Promise<void>((resolve, reject) => {
        socket.once("open", () => resolve())
        socket.once("error", (err) => reject(err))
      })
      return { socket, connected: Effect.promise(() => connected) }
    }),
    (service) => Effect.sync(() => service.socket.destroy())
  )
).pipe(Layer.provide(ConfigLive))
