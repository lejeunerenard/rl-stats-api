// @ts-nocheck
import "bare-encoding/global"

import EventEmitter from "events"
import { Effect, Stream, Layer } from "effect"
import { RLStatsService, RLStatsServiceLive } from "./layers/events.js"
import { ConnectionService, ConnectionServiceLive } from "./layers/connection.js"
import { RLStatsConfig, ConfigLive, defaultConfig } from "./layers/config.js"

// Schema
export * from "./schema/events.js"
import { AllEvents } from "./schema/events.js"
export type AllEventsType = typeof AllEvents.Type

// Effect Services & Layers
export {
  RLStatsConfig,
  ConfigLive,
  defaultConfig,
  ConnectionService,
  ConnectionServiceLive,
  RLStatsService,
  RLStatsServiceLive
}

// Effect Service Interfaces
export type { RLStatsConfig } from "./layers/config.js"
export type { ConnectionLive } from "./layers/connection.js"
export type { RLStatsLive, ParsedEvent, SchemaError } from "./layers/events.js"

export class RLStatsAPI extends EventEmitter {
  private _started
  private _service
  private _eventsFiber

  get socket() {
    return this._service?.socket
  }

  constructor(port = defaultConfig.port, host = defaultConfig.host) {
    super()
    this.port = port
    this.host = host
    this._started = false
    this._service = null
    this._eventsFiber = null
    this.start().catch(() => {})
  }

  async start() {
    if (this._started) return
    this._started = true

    const { port, host } = this

    this._service = Effect.runSync(
      Effect.provide(RLStatsService, RLStatsServiceLive)
        .pipe(
          Effect.provide(ConnectionServiceLive),
          Effect.provide(Layer.succeed(RLStatsConfig, { port, host }))
        )
    )

    await Effect.runPromise(this._service.connected)
    this.emit("connected")

    this._eventsFiber = Effect.runFork(
      Stream.runForEach(this._service.parsed, (parsed) => {
        return Effect.sync(() => {
          if (parsed.type === 'event') {
            this.emit(parsed.event, parsed.data)
          } else {
            this.emit("schema:error", parsed)
          }
        })
      })
    )
  }

  async stop() {
    if (!this._started) return
    this._started = false

    if (this._service) {
      await Effect.runPromise(this._service.socket).then(socket => socket.destroy())
      this._service = null
    }
  }
}

export default RLStatsAPI
