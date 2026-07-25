// @ts-nocheck
import { header, command, flag } from 'paparam'
import RLStatsAPI from './index.js'

const cmd = command(
  'rl-stats-api-cli',
  header('An app to collect data from the Stats API built into Rocket League'),
  flag('--port|-p [port]', 'Port for the Stats API websocket server'),
  flag('--host [host]', 'Host for the Stats API websocket server'),
  (cmd) => {
    const connection = new RLStatsAPI(cmd.flags.port, cmd.flags.host)
    connection.on('connection:error', (err) => {
      console.error('connection error', err)
    })
    connection.on('connected', () => {
      console.log('connected to Rocket League Stats API')
    })
    connection.on('UpdateState', (data) => {
      console.log('UpdateState', JSON.stringify(data, null, 2))
    })
    connection.on('GoalScored', (data) => {
      console.log('GoalScored', JSON.stringify(data, null, 2))
    })
    connection.on('BallHit', (data) => {
      console.log('BallHit', JSON.stringify(data, null, 2))
    })
    connection.on('schema:error', (err) => {
      console.error('schema error', err)
    })
  }
)

cmd.parse()
