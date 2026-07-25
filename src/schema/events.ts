// @ts-nocheck
import { Schema } from "effect"

// ============================================================================
// Shared Primitives
// ============================================================================

export const PlayerInfo = Schema.Struct({
  Name: Schema.String,
  Shortcut: Schema.Number,
  TeamNum: Schema.Number
})

export const Position3D = Schema.Struct({
  X: Schema.Number,
  Y: Schema.Number,
  Z: Schema.Number
})



// ============================================================================
// UpdateState Event Data
// ============================================================================

export const UpdateStatePlayer = Schema.Struct({
  Name: Schema.String,
  PrimaryId: Schema.String,
  Shortcut: Schema.Number,
  TeamNum: Schema.Number,
  Score: Schema.Number,
  Goals: Schema.Number,
  Shots: Schema.Number,
  Assists: Schema.Number,
  Saves: Schema.Number,
  Touches: Schema.Number,
  CarTouches: Schema.Number,
  Demos: Schema.Number,
  bHasCar: Schema.Boolean,
  Speed: Schema.Number,
  Boost: Schema.Number,
  bBoosting: Schema.Boolean,
  bOnGround: Schema.Boolean,
  bOnWall: Schema.Boolean,
  bPowersliding: Schema.Boolean,
  bDemolished: Schema.Boolean,
  Attacker: Schema.optionalWith(PlayerInfo, { exact: true }),
  bSupersonic: Schema.Boolean
})

export const UpdateStateTeam = Schema.Struct({
  Name: Schema.String,
  TeamNum: Schema.Number,
  Score: Schema.Number,
  ColorPrimary: Schema.String,
  ColorSecondary: Schema.String
})

export const UpdateStateBall = Schema.Struct({
  Speed: Schema.Number,
  TeamNum: Schema.Number
})

export const UpdateStateGame = Schema.Struct({
  Teams: Schema.Array(UpdateStateTeam),
  TimeSeconds: Schema.Number,
  bOvertime: Schema.Boolean,
  Frame: Schema.optionalWith(Schema.Number, { exact: true }),
  Elapsed: Schema.optionalWith(Schema.Number, { exact: true }),
  Ball: UpdateStateBall,
  bReplay: Schema.Boolean,
  bHasWinner: Schema.Boolean,
  Winner: Schema.optionalWith(Schema.String, { exact: true }),
  Arena: Schema.String,
  bHasTarget: Schema.Boolean,
  Target: Schema.optionalWith(PlayerInfo, { exact: true })
})

export const UpdateStateData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  Players: Schema.Array(UpdateStatePlayer),
  Game: UpdateStateGame
})

// ============================================================================
// GoalScored Event Data
// ============================================================================

export const GoalScoredData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  GoalSpeed: Schema.Number,
  GoalTime: Schema.Number,
  ImpactLocation: Position3D,
  Scorer: PlayerInfo,
  Assister: Schema.optionalWith(PlayerInfo, { exact: true }),
  BallLastTouch: Schema.Struct({
    Player: PlayerInfo,
    Speed: Schema.Number
  })
})

// ============================================================================
// BallHit Event Data
// ============================================================================

export const BallHitData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  Players: Schema.Array(PlayerInfo),
  Ball: Schema.Struct({
    PreHitSpeed: Schema.Number,
    PostHitSpeed: Schema.Number,
    Location: Position3D
  })
})

// ============================================================================
// ClockUpdatedSeconds Event Data
// ============================================================================

export const ClockUpdatedSecondsData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  TimeSeconds: Schema.Number,
  bOvertime: Schema.Boolean
})

// ============================================================================
// Minimal Events (MatchGuid only)
// ============================================================================

const MatchGuidEvent = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true })
})

export const CountdownBeginData = MatchGuidEvent
export const RoundStartedData = MatchGuidEvent
export const MatchCreatedData = MatchGuidEvent
export const MatchDestroyedData = MatchGuidEvent
export const MatchPausedData = MatchGuidEvent
export const MatchUnpausedData = MatchGuidEvent
export const GoalReplayStartData = MatchGuidEvent
export const GoalReplayEndData = MatchGuidEvent
export const GoalReplayWillEndData = MatchGuidEvent
export const PodiumStartData = MatchGuidEvent
export const ReplayCreatedData = MatchGuidEvent

// ============================================================================
// MatchInitialized (MatchGuid is REQUIRED)
// ============================================================================

export const MatchInitializedData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true })
})

// ============================================================================
// MatchEnded Event Data
// ============================================================================

export const MatchEndedData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  WinnerTeamNum: Schema.Number
})

// ============================================================================
// StatfeedEvent Data
// ============================================================================

export const StatfeedEventData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  EventName: Schema.String,
  Type: Schema.String,
  MainTarget: PlayerInfo,
  SecondaryTarget: Schema.optionalWith(PlayerInfo, { exact: true })
})

// ============================================================================
// CrossbarHit Event Data
// ============================================================================

export const CrossbarHitData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  BallLocation: Position3D,
  BallSpeed: Schema.Number,
  ImpactForce: Schema.Number,
  BallLastTouch: Schema.Struct({
    Player: PlayerInfo,
    Speed: Schema.Number
  })
})

// ============================================================================
// Wrapper Schemas (Event + Data)
// ============================================================================

export const UpdateStateSchema = Schema.Struct({ Event: Schema.Literal("UpdateState"), Data: UpdateStateData })
export const GoalScoredSchema = Schema.Struct({ Event: Schema.Literal("GoalScored"), Data: GoalScoredData })
export const BallHitSchema = Schema.Struct({ Event: Schema.Literal("BallHit"), Data: BallHitData })
export const ClockUpdatedSecondsSchema = Schema.Struct({ Event: Schema.Literal("ClockUpdatedSeconds"), Data: ClockUpdatedSecondsData })
export const CountdownBeginSchema = Schema.Struct({ Event: Schema.Literal("CountdownBegin"), Data: CountdownBeginData })
export const RoundStartedSchema = Schema.Struct({ Event: Schema.Literal("RoundStarted"), Data: RoundStartedData })
export const MatchCreatedSchema = Schema.Struct({ Event: Schema.Literal("MatchCreated"), Data: MatchCreatedData })
export const MatchInitializedSchema = Schema.Struct({ Event: Schema.Literal("MatchInitialized"), Data: MatchInitializedData })
export const MatchEndedSchema = Schema.Struct({ Event: Schema.Literal("MatchEnded"), Data: MatchEndedData })
export const MatchDestroyedSchema = Schema.Struct({ Event: Schema.Literal("MatchDestroyed"), Data: MatchDestroyedData })
export const MatchPausedSchema = Schema.Struct({ Event: Schema.Literal("MatchPaused"), Data: MatchPausedData })
export const MatchUnpausedSchema = Schema.Struct({ Event: Schema.Literal("MatchUnpaused"), Data: MatchUnpausedData })
export const StatfeedEventSchema = Schema.Struct({ Event: Schema.Literal("StatfeedEvent"), Data: StatfeedEventData })
export const CrossbarHitSchema = Schema.Struct({ Event: Schema.Literal("CrossbarHit"), Data: CrossbarHitData })
export const GoalReplayStartSchema = Schema.Struct({ Event: Schema.Literal("GoalReplayStart"), Data: GoalReplayStartData })
export const GoalReplayEndSchema = Schema.Struct({ Event: Schema.Literal("GoalReplayEnd"), Data: GoalReplayEndData })
export const GoalReplayWillEndSchema = Schema.Struct({ Event: Schema.Literal("GoalReplayWillEnd"), Data: GoalReplayWillEndData })
export const PodiumStartSchema = Schema.Struct({ Event: Schema.Literal("PodiumStart"), Data: PodiumStartData })
export const ReplayCreatedSchema = Schema.Struct({ Event: Schema.Literal("ReplayCreated"), Data: ReplayCreatedData })

// ============================================================================
// Discriminated Union
// ============================================================================

export const AllEvents = Schema.Union(
  UpdateStateSchema,
  GoalScoredSchema,
  BallHitSchema,
  ClockUpdatedSecondsSchema,
  CountdownBeginSchema,
  RoundStartedSchema,
  MatchCreatedSchema,
  MatchInitializedSchema,
  MatchEndedSchema,
  MatchDestroyedSchema,
  MatchPausedSchema,
  MatchUnpausedSchema,
  StatfeedEventSchema,
  CrossbarHitSchema,
  GoalReplayStartSchema,
  GoalReplayEndSchema,
  GoalReplayWillEndSchema,
  PodiumStartSchema,
  ReplayCreatedSchema
)
