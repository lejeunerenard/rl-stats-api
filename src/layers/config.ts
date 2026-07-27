// @ts-nocheck
import { Context, Layer } from "effect"

export interface RLStatsConfig { readonly port: number; readonly host: string }
export const RLStatsConfig = Context.Tag<RLStatsConfig>()("@rlstats/Config")
export const defaultConfig: RLStatsConfig = { port: 49123, host: "127.0.0.1" }
export const ConfigLive = Layer.succeed(RLStatsConfig, defaultConfig)
