# Roadmap

Development priorities and planned improvements for `rl-stats-api`.

## High Impact, Quick Wins

### 1. Add TypeScript Types for All Event Types

**Status:** Complete

**Current state:** The `types/` directory contains `rl-stats-api.d.ts` with all 19+ event types, `bare.d.ts` for bare-net, and `ready-resource.d.ts` for ready-resource. TypeScript is configured and source files are migrated.

**Completed:** Created comprehensive type definitions for all event types (`UpdateState`, `GoalScored`, `BallHit`, `ClockUpdatedSeconds`, `CountdownBegin`, `CrossbarHit`, `GoalReplayEnd`, `GoalReplayStart`, `GoalReplayWillEnd`, `MatchCreated`, `MatchInitialized`, `MatchDestroyed`, `MatchEnded`, `MatchPaused`, `MatchUnpaused`, `PodiumStart`, `ReplayCreated`, `RoundStarted`, `StatfeedEvent`), plus shared types (`PlayerInfo`, `Position3D`, `Rotation3D`, `Velocity`, `DemoInfo`). Added `RLStatsEventMap` interface for the event map.

**Why it matters:** Consumers of the library get autocomplete, compile-time validation, and better documentation. Makes the library production-ready.

## Medium Impact

### 2. Add Type-Safe Event Emitter

**Status:** Not started

**Current state:** `RLStatsAPI` extends `ReadyResource` which extends `events.EventEmitter`. All events are emitted as `this.emit(eventName, data)` with no type constraints on the event name or data shape.

**What needs to be done:** Replace the base `EventEmitter` with a typed variant (or use TypeScript generics) so consumers can attach listeners with full type inference:

```js
connection.on('GoalScored', (data) => {
  data.Scorer.Name  // autocomplete works
})
```

Why it matters: Prevents typos in event names at compile time. Gives consumers confidence about what data each event provides.

### 3. Improve the CLI

**Status:** Not started

**Current state:** The CLI (bin.js) connects to the API and logs errors, but does nothing useful with the actual gameplay events.
**What needs to be done:** Enhance the CLI to demonstrate library usage — e.g., pretty-print events to stdout, support filtering by event type, or format output as JSON lines for piping to other tools.

**Why it matters:** A functional CLI serves as both a working example and a debugging tool. Users can quickly inspect raw events from Rocket League without writing code.

### 4. Add Integration Tests

**Status:** Complete

**Current state:** 28 integration tests covering connection events, all 19 event types, chunked data handling, match lifecycle ordering, and data integrity. Tests use mock servers in the Bare runtime.

**Completed:** Created `test/rl-stats-api.js` with tests for: connection events (connected, connection:error), event forwarding for all 19 event types (individual tests per type), chunked data handling (split writes, multiple events per write), match lifecycle ordering (15-event sequence), and data integrity (nested structures, empty arrays). Added `test/fixtures/match-lifecycle.txt` fixture file.

**Audit fixes applied (matching official docs at https://www.rocketleague.com/developer/stats-api):**
- `MatchCreatedData`: Removed non-`MatchGuid` fields (`MatchType`, `GameMode`, `MapName`, `TeamSize`, `bIsRanked`, `bIsTournament`, `bIsMatchmaking`, `Teams`)
- `MatchEndedData`: Removed non-`MatchGuid`/`WinnerTeamNum` field (`ScoreByTeam`)
- `GoalReplayStartData`: Removed non-`MatchGuid` fields (`Scorer`, `Assister`, `GoalSpeed`, `GoalTime`, `ImpactLocation`)
- `ReplayCreatedData`: Removed non-`MatchGuid` fields (`ReplayIndex`, `ReplayName`)
- `CrossbarHitData`: Fixed field names (`ImpactLocation`→`BallLocation`, added `ImpactForce`, added `BallLastTouch`)
- `GoalScoredData`: Added missing `BallLastTouch` field
- `ClockUpdatedSecondsData`: Added missing `MatchGuid`
- `BallHitData`: Added missing `MatchGuid`
- `StatfeedEventData`: Added missing `MatchGuid`
- Updated all corresponding tests and fixture to match

**Why it matters:** Integration tests catch regressions in the connection and event forwarding logic that unit tests alone won't cover.

## Lower Priority / Larger Effort

### 5. Add Reconnection Logic

**Status:** Not started

**Current state:** If the socket connection drops (e.g., Rocket League restarts, network hiccup), the connection is dead with no automatic recovery.

**What needs to be done:** Implement a reconnection strategy with:

- Configurable max retries and backoff delay
- Automatic reconnection attempt on connection:error
- Emission of disconnected events
- Optional: pause/resume based on whether a match is in progress

**Why it matters:** Makes the library robust enough for long-running applications like broadcast HUDs or match analytics dashboards.

### 6. Add Match Lifecycle Abstractions

**Status:** Not started

**Current state:** The library emits raw events as they arrive. Consumers must track match state themselves by listening to MatchCreated, MatchInitialized, RoundStarted, MatchEnded, etc.
**What needs to be done:** Provide a higher-level abstraction that tracks match state across events:

```js
const match = rlstats.trackMatch()

match.on('start', () => { ... })
match.on('goal', (data) => { ... })
match.on('roundStart', () => { ... })
match.on('end', (data) => { ... })
match.on('destroy', () => { ... })
```

**Why it matters:** Most consumers care about the match lifecycle, not individual raw events. This reduces boilerplate and makes the library more expressive.

### 7. Add Build Step for TypeScript

**Status:** Complete

**Current state:** TypeScript is set up with `tsconfig.json`, source files are migrated to `.ts`, build scripts are configured, output goes to `dist/`, and `package.json` has proper exports and bin entry.

**Completed:** Created `tsconfig.json`, converted `index.js`, `bin.js`, and `lib/json-parse-stream.js` to TypeScript, added `build` script, configured `dist/` output, and updated `package.json` with `exports`, `main`, `bin`, and `types` fields.

**Why it matters:** Enables the type safety improvements in items 1 and 3. Provides a clean separation between source and compiled output.

