# rl-stats-api

RLStatsAPI is a library for connecting to the [Rocket League Stats API](https://www.rocketleague.com/developer/stats-api) — the built-in websocket server that broadcasts gameplay data and events during matches.

## Project Structure

```
src/
  index.ts              # RLStatsAPI class — main entry point
  lib/
    json-parse-stream.ts # Chunked JSON parser stream
types/
  rl-stats-api.d.ts     # TypeScript type definitions for all events
test/
  all.js                # Test runner
  json-parse-stream.js  # Tests for JSON parser
  rl-stats-api.js       # Integration tests (mock server)
  fixtures/
    match-lifecycle.txt  # 15-event match lifecycle fixture
  helpers/
    mock-server.js       # Test helper utilities
```

## Build & Test

```bash
npm run build    # TypeScript compilation to dist/
npm test         # Build + run tests (brittle-bare)
npm run lint     # Prettier + lunte
```

Tests run under the **Bare runtime** via `brittle-bare`. Node.js is only used for building and running the test runner.

## Runtime Support

The library supports both **Node.js** and **Bare** through conditional imports in `package.json` (`imports` field maps `events`, `fs`, `net`, `path`, `stream` to bare-* equivalents when running under Bare).

## Architecture

`RLStatsAPI` extends `ReadyResource` and connects to a local websocket (default: `127.0.0.1:49123`). Incoming data is piped through `ParseJSONStream` (handles chunked/boundary-crossing JSON) into a `Writable` that emits each parsed event as `rlstats.emit(eventName, data)`.

All event types follow the [official spec](https://www.rocketleague.com/developer/stats-api). The `MatchGuid` field is optional — only present for online/LAN matches.

## Conventions

- Source files use `// @ts-nocheck` (types are in `types/rl-stats-api.d.ts`)
- Tests use **brittle v3.19+** with `t.teardown()` (not `t.cleanup()`)
- Mock server tests: bind to `'127.0.0.1'` explicitly (IPv4), destructure `connection` event as `[socket, info]`
- Tests import from `dist/` (compiled CommonJS)
- All tests in `test/all.js` are imported and run together
- Event data objects match the official Rocket League Stats API spec exactly

## Key Dependencies

- **streamx** — streams (Transform, Writable)
- **ready-resource** — base class for RLStatsAPI
- **bare-net / bare-events / bare-fs / bare-stream / bare-path** — Bare runtime equivalents
- **paparam** — CLI argument parsing
- **brittle** — test framework
- **typescript** — compilation
