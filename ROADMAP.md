# Roadmap

Development priorities and planned improvements for `rl-stats-api`.

## High Impact, Quick Wins

### 1. Add TypeScript Types for All Event Types

**Status:** Not started

**Current state:** The `types/` directory exists but is empty. TypeScript and `@types/streamx` are listed as devDependencies but not used. Events are emitted as raw `any` with no type safety.

**What needs to be done:** Create TypeScript type definitions for all 19+ event types (`UpdateState`, `GoalScored`, `BallHit`, `ClockUpdatedSeconds`, `CountdownBegin`, `CrossbarHit`, `GoalReplayEnd`, `GoalReplayStart`, `GoalReplayWillEnd`, `MatchCreated`, `MatchInitialized`, `MatchDestroyed`, `MatchEnded`, `MatchPaused`, `MatchUnpaused`, `PodiumStart`, `ReplayCreated`, `RoundStarted`, `StatfeedEvent`) matching the official API documentation at https://www.rocketleague.com/developer/stats-api. Include conditional fields and spectator-only fields.

**Why it matters:** Consumers of the library get autocomplete, compile-time validation, and better documentation. Makes the library production-ready.

### 2. Fix `package.json` / `package-lock.json` Mismatch

**Status:** Not started

**Current state:** The `package-lock.json` references `bin/rl-stats-api-cli: dist/bin.js` (implying a build step to `dist/`) while `package.json` scripts reference `bare ./bin.js` directly. The lock file also lists `@types/streamx` and `typescript` as devDependencies that are absent from `package.json`.

**What needs to be done:** Reconcile the two files. Either remove the `dist/` reference if there's no build step planned, or add the build infrastructure if TypeScript compilation is intended.

**Why it matters:** Inconsistent lock files cause installation issues and confusion about the intended build process.

## Medium Impact

### 3. Add Type-Safe Event Emitter

**Status:** Not started

**Current state:** `RLStatsAPI` extends `ReadyResource` which extends `events.EventEmitter`. All events are emitted as `this.emit(eventName, data)` with no type constraints on the event name or data shape.

**What needs to be done:** Replace the base `EventEmitter` with a typed variant (or use TypeScript generics) so consumers can attach listeners with full type inference:

```js
connection.on('GoalScored', (data) => {
  data.Scorer.Name  // autocomplete works
})
```

Why it matters: Prevents typos in event names at compile time. Gives consumers confidence about what data each event provides.

### 4. Improve the CLI

**Status:** Not started

**Current state:** The CLI (bin.js) connects to the API and logs errors, but does nothing useful with the actual gameplay events.
**What needs to be done:** Enhance the CLI to demonstrate library usage — e.g., pretty-print events to stdout, support filtering by event type, or format output as JSON lines for piping to other tools.

**Why it matters:** A functional CLI serves as both a working example and a debugging tool. Users can quickly inspect raw events from Rocket League without writing code.

### 5. Add Integration Tests

**Status:** Not started

**Current state:** Tests exist only for ParseJSONStream (the chunked JSON parser). There are no tests for the connection, event forwarding, or the end-to-end flow.

**What needs to be done:** Add tests that verify RLStatsAPI correctly:

- Emits a connected event when the socket opens
- Forwards parsed { Event, Data } objects as typed events
- Handles connection errors appropriately
- Processes chunked data correctly end-to-end

**Why it matters:** Integration tests catch regressions in the connection and event forwarding logic that unit tests alone won't cover.

## Lower Priority / Larger Effort

### 6. Add Reconnection Logic

**Status:** Not started

**Current state:** If the socket connection drops (e.g., Rocket League restarts, network hiccup), the connection is dead with no automatic recovery.

**What needs to be done:** Implement a reconnection strategy with:

- Configurable max retries and backoff delay
- Automatic reconnection attempt on connection:error
- Emission of disconnected events
- Optional: pause/resume based on whether a match is in progress

**Why it matters:** Makes the library robust enough for long-running applications like broadcast HUDs or match analytics dashboards.

### 7. Add Match Lifecycle Abstractions

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

### 8. Add Build Step for TypeScript

**Status:** Not started

**Current state:** The project has typescript and @types/streamx as devDependencies but no tsconfig.json, no build scripts, and all source files are .js.

**What needs to be done:** Set up TypeScript compilation:

- Create `tsconfig.json`
- Migrate source files to `.ts`
- Add build scripts (`build`, `pretest`, etc.)
- Configure output to `dist/`
- Update `package.json` exports and bin entry

**Why it matters:** Enables the type safety improvements in items 1 and 3. Provides a clean separation between source and compiled output.

