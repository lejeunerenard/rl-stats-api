# rl-stats-api

A library for connecting to the [Rocket League Stats API](https://www.rocketleague.com/developer/stats-api) — the built-in websocket server that broadcasts gameplay data and events during matches.

## Prerequisites

The Rocket League Stats API is enabled by editing `DefaultStatsAPI.ini` in your Rocket League config directory before launching the client. The key setting is:

```ini
[StatsAPI]
PacketSendRate=30.0
```

Set `PacketSendRate` to a value greater than 0 to enable the websocket (capped at 120). See the [official documentation](https://www.rocketleague.com/developer/stats-api) for the full configuration reference.

## Installation

```bash
npm install rl-stats-api
```

## Quick Start

```js
const RLStatsAPI = require('rl-stats-api')

const connection = new RLStatsAPI()

connection.on('connected', () => {
  console.log('Connected to Rocket League Stats API')
})

connection.on('UpdateState', (data) => {
  console.log('Match time:', data.Game.TimeSeconds, 'seconds remaining')
  console.log('Blue score:', data.Game.Teams[0]?.Score)
  console.log('Orange score:', data.Game.Teams[1]?.Score)
})

connection.on('GoalScored', (data) => {
  console.log(`${data.Scorer.Name} scored!`)
  if (data.Assister) {
    console.log(`Assist: ${data.Assister.Name}`)
  }
})

connection.on('MatchEnded', (data) => {
  console.log(`Match over! Team ${data.WinnerTeamNum} wins.`)
})
```

## API

### `new RLStatsAPI(port, host)`

Creates a connection to the Rocket League Stats API websocket.

| Parameter | Type   | Default       | Description              |
| --------- | ------ | ------------- | ------------------------ |
| `port`    | number | `49123`       | Stats API websocket port |
| `host`    | string | `'127.0.0.1'` | Stats API websocket host |

### Events

The API inherits from `events.EventEmitter`. All events listed below are also emitted by the underlying socket connection.

#### Connection Events

| Event              | Data    | Description                   |
| ------------------ | ------- | ----------------------------- |
| `connected`        | —       | Socket connection established |
| `connection:error` | `Error` | Socket-level error occurred   |

#### Gameplay Events

All event types listed below follow the [Rocket League Stats API specification](https://www.rocketleague.com/developer/stats-api). Each event provides an `Event` and `Data` object that is emitted as `rlstats.emit(eventName, data)`.

**`UpdateState`** — Broadcast at the rate set by `PacketSendRate` (default: every frame of the configured rate). Contains the full match state snapshot.

```js
rlstats.on('UpdateState', (data) => {
  // data.MatchGuid
  // data.Players[] — player stats (Name, Score, Goals, Shots, Saves, Speed, Boost, Loadout, PickupClass, etc.)
  // data.Game.Teams[] — { Name, TeamNum, Score, ColorPrimary, ColorSecondary }
  // data.Game.TimeSeconds, data.Game.bOvertime
  // data.Game.Ball — { Speed, TeamNum }
  // data.Game.Arena, data.Game.Winner
})
```

**`GoalScored`** — Sent when a goal is scored.

```js
rlstats.on('GoalScored', (data) => {
  // data.Scorer — { Name, Shortcut, TeamNum }
  // data.Assister? — { Name, Shortcut, TeamNum } (only if assist was recorded)
  // data.GoalSpeed, data.GoalTime
  // data.ImpactLocation — { X, Y, Z }
  // data.MatchGuid
})
```

**`BallHit`** — Sent one frame after the ball is hit.

```js
rlstats.on('BallHit', (data) => {
  // data.Players[] — { Name, Shortcut, TeamNum }
  // data.Ball — { PreHitSpeed, PostHitSpeed, Location: { X, Y, Z } }
})
```

**`ClockUpdatedSeconds`** — Sent when the in-game clock changes.

```js
rlstats.on('ClockUpdatedSeconds', (data) => {
  // data.TimeSeconds, data.bOvertime
})
```

**`CountdownBegin`** — Sent at the start of each round.

**`RoundStarted`** — Sent when the game enters the active state (after countdown).

**`MatchCreated`** — Sent when all teams are created and replicated.

**`MatchInitialized`** — Sent when the first countdown starts.

**`MatchEnded`** — Sent when the match ends and a winner is chosen.

```js
rlstats.on('MatchEnded', (data) => {
  // data.WinnerTeamNum
})
```

**`MatchDestroyed`** — Sent when leaving the game.

**`MatchPaused` / `MatchUnpaused`** — Sent when a match admin pauses or unpauses the game.

**`StatfeedEvent`** — Sent when someone earns a stat (demolition, save, etc.).

```js
rlstats.on('StatfeedEvent', (data) => {
  // data.EventName — e.g. "Demolish", "Save"
  // data.Type — localized label, e.g. "Demolition"
  // data.MainTarget — { Name, Shortcut, TeamNum }
  // data.SecondaryTarget? — involved player
})
```

**`CrossbarHit`** — Sent when the ball hits a crossbar.

**`GoalReplayStart` / `GoalReplayEnd` / `GoalReplayWillEnd`** — Sent around goal replays.

**`PodiumStart`** — Sent when the game enters the podium state after the match.

**`ReplayCreated`** — Sent when a replay is initialized (from Match History, not goal replays).

**`BoostPickup`** — Sent when a vehicle collects a boost pad or pill (SPECTATOR).

```js
rlstats.on('BoostPickup', (data) => {
  // data.Player — { Name, Shortcut, TeamNum }
  // data.Location — { X, Y, Z }
  // data.BoostAmount, data.BoostType (e.g. "BoostType_Pad", "BoostType_Pill")
  // data.bReplay
})
```

**`PlayerJoined`** — Sent when a player is added to the current match.

```js
rlstats.on('PlayerJoined', (data) => {
  // data.PlayerName
  // data.PrimaryId (e.g. "Steam|123|0")
})
```

**`PlayerLeft`** — Sent when a player is removed from the current match.

```js
rlstats.on('PlayerLeft', (data) => {
  // data.PlayerName
  // data.PrimaryId (e.g. "Steam|123|0")
})
```

> **Note:** `MatchGuid` is only set for online or LAN matches. Fields marked `CONDITIONAL` in the official spec only appear when relevant. Fields marked `SPECTATOR` only appear if the client is spectating or on the player's team.

## CLI

A command-line interface is included for quick inspection:

```bash
# Using Node.js
node ./bin.js --port 49123 --host 127.0.0.1

# Using the Bare runtime
npm start -- --port 49123
```

| Flag     | Short | Description              |
| -------- | ----- | ------------------------ |
| `--port` | `-p`  | Stats API websocket port |
| `--host` |       | Stats API websocket host |

## Running Tests

```bash
npm test
```

## Runtime Support

This library supports both **Node.js** and the [**Bare**](https://bare.pears.com/) runtime through conditional imports in `package.json`.

## License

MIT
