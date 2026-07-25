// @ts-nocheck
import ReadyResource from 'ready-resource'
import net from 'net'
import ParseJSONStream from './lib/json-parse-stream.js'
import { Writable } from 'streamx'

const log = console

export default class RLStatsAPI extends ReadyResource {
  port
  host
  socket

  constructor(port = 49123, host = '127.0.0.1') {
    super()

    this.port = port
    this.host = host

    const socket = net.createConnection(port, host)
    this.socket = socket
    this.socket
      .on('error', (err) => this.emit('connection:error', err))
      .on('open', () => {
        log.info('socket opened', 'port', port, 'host', host)
        this.emit('connected')
      })

    const self = this
    const parser = new ParseJSONStream()
    const emitter = new Writable({
      write(obj, cb) {
        const { Event, Data } = obj
        self.emit(Event, Data)
        cb(null)
      }
    })

    parser.pipe(emitter)
    socket.pipe(parser)
  }
}
