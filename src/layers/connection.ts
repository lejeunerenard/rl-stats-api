import { Context, Effect, Layer } from 'effect'
import { makeNet } from '@effect/platform-node-shared/NodeSocket'
import * as Socket from '@effect/platform/Socket'
import { Socket as BareSocket } from 'bare-net'
import { RLStatsConfig } from './config.js'

// HACK BareSocket doesn't use `bare-stream` streams but `streamx` streams which
// don't have the `.closed` property. Effect's `NodeSocket` uses `.closed` so
// never closes the socket.
if (!('closed' in BareSocket.prototype)) {
  Object.defineProperty(BareSocket.prototype, 'closed', {
    get(this: BareSocket) {
      return this.destroyed
    },
    configurable: true
  })
}

export interface ConnectionLive {
  readonly connected: Effect.Effect<void, Socket.SocketError, never>
  readonly socket: Socket.Socket
}

export class ConnectionService extends Context.Tag('@rlstats/Connection')<
  ConnectionService,
  ConnectionLive
>() {}

export const ConnectionServiceLive = Layer.effect(
  ConnectionService,
  Effect.gen(function* () {
    const { port, host } = yield* RLStatsConfig

    const socket = yield* makeNet({ port, host })

    const connected = Effect.asVoid(Effect.succeed(socket))

    return {
      connected,
      socket
    }
  })
)
