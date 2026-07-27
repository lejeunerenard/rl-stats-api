// @ts-nocheck
import { Context, Effect, Layer, Stream, Queue } from "effect"
import net from "net"
import { ConnectionService } from "./connection.js"
import { decodeAndParse } from "../lib/json-parse-stream.js"

export interface ParsedEvent {
  type: 'event'
  event: string
  data: unknown
}

export interface SchemaError {
  type: 'error'
  error: unknown
  raw: string
}

export interface RLStatsLive {
  readonly parsed: Stream.Stream<ParsedEvent | SchemaError, never>
  readonly socket: Effect<net.Socket>
  readonly connected: Effect<void, Error, never>
  readonly closed: Effect<void, never>
}

export class RLStatsService extends Context.Tag<RLStatsService, RLStatsLive>()("@rlstats/Events") {}

export const RLStatsServiceLive = Layer.effect(
  RLStatsService,
  Effect.flatMap(ConnectionService, (connection) =>
    Effect.flatMap(
      Queue.unbounded<ParsedEvent | SchemaError>(),
      (queue) => {
        const socketEffect = connection.socket
        const connected = connection.connected
        const closed = connection.closed

        let _buffer = ""

        const processChunk = (chunk: Buffer) => {
          _buffer += chunk.toString()
          const { results, remainder } = decodeAndParse(_buffer)
          _buffer = remainder
          for (const result of results) {
            queue.unsafeOffer(result)
          }
        }

        const onClose = () => {
          Effect.runPromise(Queue.shutdown(queue)).catch(() => {})
        }

        return Effect.flatMap(socketEffect, (socket) => {
          socket.on("data", processChunk)
          socket.on("close", onClose)

          const parsed = Stream.fromQueue(queue)

          return Effect.succeed({
            parsed,
            socket: connection.socket,
            connected,
            closed
          })
        })
      }
    )
  )
)
