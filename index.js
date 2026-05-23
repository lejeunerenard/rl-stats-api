const ReadyResource = require('ready-resource')
const net = require('net')

const log = console // new Log()

module.exports = class RLStatsAPI extends ReadyResource {
  constructor(port = 49123, host = '127.0.0.1') {
    super()

    this.port = port
    this.host = host

    const socket = net.createConnection(port, host)
    this.socket = socket
    this.socket
      .on('data', (data) => {
	const jsonString = data.toString()
        try {
	  const eventObj = JSON.parse(jsonString)
	  const { Event, Data } = eventObj
	  this.emit(Event, Data)
	} catch (err) {
	  log.error('connection:data json parsing jsonString', jsonString)
	  log.error('connection:data json parsing error', err)
	  if (err.message.match(/JSON at position \d/)) {
            const positionM = err.message.match(/JSON at position (\d+)/)
	    console.log('positionM', positionM)
	    const position = Number(positionM[1])
            const char = jsonString[position]
	    console.log('char', char, 'char(hex)', Buffer.from(char))
	    const bleed = 10
	    console.log('char slice', jsonString.slice(Math.max(0, position - bleed), Math.min(jsonString.length, position + bleed)))
	  }
	}
      })
      .on('error', (err) => this.emit('connection:error', err))
      .on('open', () => {
        log.info('socket opened', 'port', port, 'host', host)
        this.emit('connected')
      })
  }
}
