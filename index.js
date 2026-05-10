const ReadyResource = require('ready-resource')
const { Socket } = require('ws')
const Log = require('bare-logger')

const log = new Log()

module.exports = class RLStatsAPI extends ReadyResource {
  constructor(port = 49123, host = '127.0.0.1') {
    super()

    this.port = port
    this.host = host

    const socket = new Socket({ port, host })
    this.socket = socket
    this.socket
      .on('error', (err) => this.emit('error', err))
      .on('open', () => {
        log.info('socket opened', 'port', port, 'host', host)
        this.emit('connected')
      })
  }
}
