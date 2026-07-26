// @ts-nocheck
import "bare-encoding/global"

import EventEmitter from "events"
import net from "net"
import { decodeAndParse } from "./lib/json-parse-stream.js"
import { ConfigLive, defaultConfig } from "./layers/config.js"

// Schema
export * from "./schema/events.js"
import { AllEvents } from "./schema/events.js"
export type AllEventsType = typeof AllEvents.Type

export class RLStatsAPI extends EventEmitter {
  port
  host
  socket
  _started
  _buffer
  connecting

  constructor(port = defaultConfig.port, host = defaultConfig.host) {
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
    const { results, remainder } = decodeAndParse(this._buffer)
    this._buffer = remainder

    for (const result of results) {
      if (result.type === 'event') {
        this.emit(result.event, result.data)
      }
      else {
        this.emit("schema:error", result.error)
      }
    }
  }
}

export default RLStatsAPI
