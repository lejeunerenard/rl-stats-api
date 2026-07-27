const { once } = require('events')
const net = require('net')
const { Effect } = require('effect')

const RLStatsAPI = require('../../dist/index.js').default

async function createServerAndConnection () {
  const server = net.createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port

  const connectionPromise = once(server, 'connection')

  const connection = new RLStatsAPI(port)
  await once(connection, 'connected')

  const [socket] = await connectionPromise

  return { server, socket, connection, port }
}

function sendEvent (socket, event, data) {
  socket.write(JSON.stringify({ Event: event, Data: data }) + '\n')
}

async function closeConnection (connection) {
  const socket = await Effect.runPromise(connection.socket)
  socket.end()
  await new Promise(resolve => {
    socket.on('close', resolve)
    setTimeout(resolve, 1000)
  })
}

module.exports = { createServerAndConnection, sendEvent, closeConnection }
