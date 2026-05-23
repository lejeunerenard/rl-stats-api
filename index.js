const ReadyResource = require('ready-resource')
const net = require('net')
const ParseJSONStream = require('./lib/json-parse-stream.js')
const { pipeline } = require('stream')

const log = console // new Log()

module.exports = class RLStatsAPI extends ReadyResource {
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

    pipeline(
      this.socket,
      new ParseJSONStream(),
      this._emitEvent,
      (err) => {
        if (err) {
          console.error('stream err', err)
        } else {
          console.log('connection done')
        }
      }
    )
  }

  async * _emitEvent (source) {
    for await (const eventObj of source) {
      const { Event, Data } = eventObj
      this.emit(Event, Data)
    }
  }
}
