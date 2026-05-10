const { header, command, flag } = require('paparam')
const RLStatsAPI = require('./index.js')

const cmd = command(
  'rl-stats-api-cli',
  header('An app to collect data from the Stats API built into Rocket League'),
  flag('--port|-p [port]', 'Port for the Stats API websocket server'),
  flag('--host [host]', 'Host for the Stats API websocket server'),
  (cmd) => {
    const connection = new RLStatsAPI(cmd.flags.port, cmd.flags.host)
    connection.on('error', (err) => {
      console.error('connection error', err)
    })
  }
)

cmd.parse()
