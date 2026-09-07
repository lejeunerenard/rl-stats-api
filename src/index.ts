import 'bare-encoding/global'

import EventEmitter from 'events'
import { Channel, Effect, Either, Fiber, Layer, ParseResult, Stream } from 'effect'
import type { SocketError } from '@effect/platform/Socket'
import { RLStatsService, RLStatsServiceLive } from './layers/events.js'
import { ConnectionService, ConnectionServiceLive } from './layers/connection.js'
import { RLStatsConfig, ConfigLive } from './layers/config.js'

// Schema
export * from './schema/events.js'
import type { AllEventsType as AllEvents } from './schema/events.js'
export type AllEventsType = AllEvents

// Effect Services & Layers
export { ConfigLive, ConnectionService, ConnectionServiceLive, RLStatsService, RLStatsServiceLive }

// Effect Service Interfaces
export type { RLStatsConfig } from './layers/config.js'
export type { ConnectionLive } from './layers/connection.js'
export type { RLStatsLive } from './layers/events.js'

import type { RLStatsLive } from './layers/events.js'

export class RLStatsAPI extends EventEmitter {
  port: number
  host: string
  private _started: boolean
  private _stopping: boolean
  private _service: RLStatsLive | null
  private _eventsFiber: ReturnType<typeof Effect.runFork> | null

  constructor(port: number, host: string) {
    super()
    this.port = port
    this.host = host
    this._started = false
    this._stopping = false
    this._service = null
    this._eventsFiber = null
    this.start().catch(() => {})
  }

  async start() {
    if (this._started) return
    this._started = true

    const { port, host } = this

    this._service = Effect.runSync(
      Effect.provide(RLStatsService, RLStatsServiceLive).pipe(
        Effect.provide(ConnectionServiceLive),
        Effect.provide(Layer.succeed(RLStatsConfig, { port, host }))
      )
    )

    await Effect.runPromise(this._service.connected)
    this.emit('connected')

    this._eventsFiber = Effect.runFork(
      Stream.runForEach(
        Channel.toStream<
          Either.Either<AllEvents, ParseResult.ParseError>,
          SocketError,
          void,
          never
        >(this._service.parsed as any),
        (parsed: Either.Either<AllEvents, ParseResult.ParseError>) => {
          Either.match(parsed, {
            onLeft: (error) => {
              this.emit('schema:error', error)
            },
            onRight: ({ Event, Data }) => {
              this.emit(Event, Data)
            }
          })
          return Effect.succeed(undefined)
        }
      )
    )
  }

  async stop() {
    if (!this._started || this._stopping) return
    this._stopping = true
    this._started = false
    if (this._eventsFiber) {
      await Effect.runPromise(Fiber.interrupt(this._eventsFiber))
      this._eventsFiber = null
    }
    this._service = null
  }
}

export default RLStatsAPI
