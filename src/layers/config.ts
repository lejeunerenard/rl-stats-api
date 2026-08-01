import { Context, Config, Effect, Layer } from 'effect'

export class RLStatsConfig extends Context.Tag('@rlstats/Config')<
  RLStatsConfig,
  { readonly port: number; readonly host: string }
>() {}

export const ConfigLive = Layer.effect(
  RLStatsConfig,
  Effect.gen(function* () {
    const host = yield* Config.string('host').pipe(Config.withDefault('127.0.0.1'))
    // Use default 8080 if PORT is not set
    const port = yield* Config.number('port').pipe(Config.withDefault(49123))
    return { host, port }
  })
)
