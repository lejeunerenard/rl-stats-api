// @ts-nocheck
import "bare-encoding/global"

import EventEmitter from "events"
import net from "net"
import { decodeEventStrict } from "./schema/decode.js"
import { Effect, Exit, Option } from "effect"
import {
  PlayerInfo,
  Position3D,
  UpdateStateData,
  GoalScoredData,
  BallHitData,
  ClockUpdatedSecondsData,
  CountdownBeginData,
  RoundStartedData,
  MatchCreatedData,
  MatchInitializedData,
  MatchEndedData,
  MatchDestroyedData,
  MatchPausedData,
  MatchUnpausedData,
  StatfeedEventData,
  CrossbarHitData,
  GoalReplayStartData,
  GoalReplayEndData,
  GoalReplayWillEndData,
  PodiumStartData,
  ReplayCreatedData,
  AllEvents
} from "./schema/events.js"

export function extractOneObject(working: string): Option<{ parsed: unknown; remainder: string }> {
  if (working.length === 0) return Option.none()

  let start = 0
  while (start < working.length && /\s/.test(working[start])) {
    start++
  }
  if (start === working.length) return Option.none()

  const startChar = working[start]
  const endChar = startChar === '[' ? ']' : startChar === '{' ? '}' : null
  if (!endChar) return Option.none()

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < working.length; i++) {
    const char = working[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === '\\' && inString) {
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === '{' || char === '[') {
      depth++
    } else if (char === '}' || char === ']') {
      depth--
      if (depth === 0) {
        const str = working.substring(0, i + 1)
        try {
          const obj = JSON.parse(str)
          return Option.some({ parsed: obj, remainder: working.substring(i + 1) })
        }
        catch {
          return Option.none()
        }
      }
    }
  }

  return Option.none()
}

export {
  AllEvents,
  decodeEventStrict,
  PlayerInfo,
  Position3D,
  UpdateStateData,
  GoalScoredData,
  BallHitData,
  ClockUpdatedSecondsData,
  CountdownBeginData,
  RoundStartedData,
  MatchCreatedData,
  MatchInitializedData,
  MatchEndedData,
  MatchDestroyedData,
  MatchPausedData,
  MatchUnpausedData,
  StatfeedEventData,
  CrossbarHitData,
  GoalReplayStartData,
  GoalReplayEndData,
  GoalReplayWillEndData,
  PodiumStartData,
  ReplayCreatedData
}

export type AllEventsType = typeof AllEvents.Type

export class RLStatsAPI extends EventEmitter {
  port
  host
  socket
  _started
  _buffer
  connecting

  constructor(port = 49123, host = "127.0.0.1") {
    super()
    this.port = port
    this.host = host
    this._started = false
    this._buffer = ""
    this.connecting = this.connect()
  }

  async start() {
    if (this._started) return
    this._started = true
  }

  async stop() {
    if (!this._started) return
    this._started = false
    if (this.socket) {
      this.socket.destroy()
      this.socket = null
    }
  }

  private connect() {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(this.port, this.host)
      this.socket = socket
      socket.on("connect", () => {
        this.emit("connected")
        resolve()
      })
      socket.on("error", (err) => {
        this.emit("connection:error", err)
        reject(err)
      })
      socket.on("data", (chunk) => {
        this.handleData(chunk.toString())
      })
    })
  }

  private handleData(str) {
    this._buffer += str
    let result
    do {
      result = extractOneObject(this._buffer)
      if (Option.isSome(result)) {
        const { parsed, remainder } = result.value
        this._buffer = remainder
        const exit = Effect.runSyncExit(decodeEventStrict(parsed))
        if (Exit.isSuccess(exit)) {
          const event = exit.value
          this.emit(event.Event, event.Data)
        }
        else {
          this.emit("schema:error", exit.cause)
        }
      }
    } while (Option.isSome(result))
  }
}

export default RLStatsAPI
