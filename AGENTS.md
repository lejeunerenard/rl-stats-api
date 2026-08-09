# rl-stats-api

RLStatsAPI is a library for connecting to the [Rocket League Stats API](https://www.rocketleague.com/developer/stats-api) — the built-in websocket server that broadcasts gameplay data and events during matches.

## Project Structure

```
src/
  index.ts              # RLStatsAPI class — main entry point (EventEmitter)
  bin.ts                # CLI entry point (paparam + Effect)
  lib/
    json-parse-stream.ts # Chunked JSON parser (extractOneObject, decodeAndParse)
  schema/
    events.ts            # Effect-ts Schema definitions for all 22 event types
    decode.ts            # Decode helpers (Effect + Either)
  layers/
    config.ts            # RLStatsConfig Effect Layer
    connection.ts        # ConnectionService Effect Layer (net + PassThrough)
    events.ts            # RLStatsService Effect Layer
types/
  rl-stats-api.d.ts     # TypeScript type definitions for all events
  bare.d.ts             # bare-net type declarations
test/
  all.js                # Test runner
  json-parse-stream.js  # Tests for JSON parser
  extract-one-object.js # Unit tests for extractOneObject
  rl-stats-api.js       # Integration tests (mock server)
  events-layer.js       # Effect layer integration tests
  schema/
    events.test.js      # Schema validation tests
  fixtures/
    match-lifecycle.txt  # 15-event match lifecycle fixture
    update-state-simple.json
    real-game-updatestate.json
    out1780278903814.json
  helpers/
    mock-server.js       # Test helper utilities
```

## Build & Test

```bash
npm run build    # TypeScript compilation to dist/
npm test         # Build + run tests (brittle-bare)
npm run lint     # Prettier + lunte
npm run format   # Prettier (fix mode)
```

Tests run under the **Bare runtime** via `brittle-bare`. Node.js is only used for building and running the test runner.

## Runtime Support

The library supports both **Node.js** and **Bare** through conditional imports in `package.json` (`imports` field maps `events`, `fs`, `net`, `path`, `stream` to bare-* equivalents when running under Bare).

## Architecture

`RLStatsAPI` extends `EventEmitter` and connects to a local socket (default: `127.0.0.1:49123`). The library uses **Effect-ts** with a layered architecture:

- **ConnectionLayer** (`src/layers/connection.ts`) — creates a `net.Socket` connection and exposes it as an Effect Layer via `PassThrough` stream
- **EventsLayer** (`src/layers/events.ts`) — pipes socket data through `decodeAndParse()` (from `json-parse-stream.ts`), validates against Effect-ts Schemas, and emits parsed events
- **ConfigLayer** (`src/layers/config.ts`) — provides configurable port and host via Effect Config

Incoming data flows through `decodeAndParse()` → `extractOneObject()` for chunked JSON parsing → Effect-ts Schema validation with strict mode (rejects unknown fields). Events are emitted as `rlstats.emit(Event, Data)` where the event name comes from the parsed data. Schema validation errors are emitted as `rlstats.emit('schema:error', error)`.

All event types follow the [official spec](https://www.rocketleague.com/developer/stats-api). The `MatchGuid` field is optional — only present for online/LAN matches.

## Schema System

All 22 event types are defined as Effect-ts Schemas in `src/schema/events.ts`:

- **Shared primitives:** `PrimaryId` (transforms `"Steam|123|0"` string to `{Platform, Uid, Splitscreen}`), `PlayerInfo`, `Position3D`
- **Complex schemas:** `UpdateStatePlayer`, `UpdateStateTeam`, `UpdateStateBall`, `UpdateStateGame`, `UpdateStateData`
- **Event schemas:** Each event has a `Data` schema (e.g., `GoalScoredData`) and a wrapper schema combining `Event` literal + `Data` struct (e.g., `GoalScoredSchema`)
- **Discriminated union:** `AllEvents` union of all event schemas
- **Strict mode:** Excess/unknown fields are rejected via `{ onExcessProperty: 'error' }`
- **Decode helpers:** `decodeEvent`, `decodeEventStrict`, `decodeEventEither`, `decodeEventEitherStrict` in `src/schema/decode.ts`

## Layer Architecture

Three Effect-ts Layers compose to power the library:

```
RLStatsConfig (ConfigLive)
  ↓
ConnectionService (ConnectionServiceLive)
  ↓
RLStatsService (RLStatsServiceLive)
```

Layers compose via `Effect.provide()` chaining. The `RLStatsAPI` class wires layers together:

```js
const service = Effect.runSync(
  Effect.provide(RLStatsService, RLStatsServiceLive).pipe(
    Effect.provide(ConnectionServiceLive),
    Effect.provide(Layer.succeed(RLStatsConfig, { port, host }))
  )
)
```

Services are exposed as Context Tags (`RLStatsService`, `ConnectionService`, `RLStatsConfig`) and their live implementations as `*Live` layers.

## CLI

A command-line interface is included for quick inspection of events:

```bash
# Using Node.js
node ./bin.js --port 49123 --host 127.0.0.1

# Using the Bare runtime
npm start -- --port 49123
```

The CLI uses **paparam** for argument parsing and demonstrates Effect-ts usage with `Effect.runPromise` + `Effect.runFork`. It pipes parsed events through `Stream.runForEach` and pretty-prints `UpdateState`, `GoalScored`, and `BallHit` events to stdout.

## Conventions

- Source files use `strict: true` in tsconfig (fully typed, no `// @ts-nocheck`)
- Tests use **brittle v3.19+** with `t.teardown()` (not `t.cleanup()`)
- Mock server tests: bind to `'127.0.0.1'` explicitly (IPv4), destructure `connection` event as `[socket, info]`
- Tests import from `dist/` (compiled CommonJS)
- All tests in `test/all.js` are imported and run together
- Effect-ts tests: use `Effect.runSyncExit()` + `Exit.isSuccess()` / `Exit.isFailure()`, `Effect.runFork()` + `Stream.runForEach()`, `Either.match()` for Either types, `Option.isSome()` / `Option.isNone()` for Option results
- Files using Effect-ts require `require('bare-encoding/global')` import
- Event data objects match the official Rocket League Stats API spec exactly

## Key Dependencies

- **effect** (v3.22) — Schema, Effect, Layer, Stream, Either, Option, ParseResult
- **bare-encoding** — required global setup for Effect
- **bare-events** — Bare runtime event emitter
- **bare-net / bare-fs / bare-stream / bare-path** — Bare runtime equivalents
- **paparam** — CLI argument parsing
- **brittle** — test framework
- **typescript** (v6) — compilation
