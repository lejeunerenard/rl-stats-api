import { Schema } from 'effect'

// ============================================================================
// Shared Primitives
// ============================================================================

export const PrimaryId = Schema.transform(
  Schema.String,
  Schema.Struct({
    Platform: Schema.String,
    Uid: Schema.String,
    Splitscreen: Schema.Number
  }),
  {
    decode: (raw) => {
      const [Platform, Uid, Splitscreen] = raw.split('|')
      return { Platform: Platform ?? '', Uid: Uid ?? '', Splitscreen: Number(Splitscreen) || 0 }
    },
    encode: ({ Platform, Uid, Splitscreen }) => `${Platform}|${Uid}|${Splitscreen}`
  }
)

export type PrimaryIdType = Schema.Schema.Type<typeof PrimaryId>

export const PlayerInfo = Schema.Struct({
  Name: Schema.String,
  Shortcut: Schema.Number,
  TeamNum: Schema.Number
})
export type PlayerInfoType = Schema.Schema.Type<typeof PlayerInfo>

export const Position3D = Schema.Struct({
  X: Schema.Number,
  Y: Schema.Number,
  Z: Schema.Number
})
export type Position3DType = Schema.Schema.Type<typeof Position3D>

// ============================================================================
// UpdateState Event Data
// ============================================================================

export const UpdateStatePlayer = Schema.Struct({
  Name: Schema.String,
  PrimaryId: PrimaryId,
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
  Loadout: Schema.optionalWith(Schema.Array(Schema.String), { exact: true }),
  bHasCar: Schema.optionalWith(Schema.Boolean, { exact: true }),
  Speed: Schema.optionalWith(Schema.Number, { exact: true }),
  Boost: Schema.optionalWith(Schema.Number, { exact: true }),
  bBoosting: Schema.optionalWith(Schema.Boolean, { exact: true }),
  bOnGround: Schema.optionalWith(Schema.Boolean, { exact: true }),
  bOnWall: Schema.optionalWith(Schema.Boolean, { exact: true }),
  bPowersliding: Schema.optionalWith(Schema.Boolean, { exact: true }),
  bDemolished: Schema.optionalWith(Schema.Boolean, { exact: true }),
  Attacker: Schema.optionalWith(PlayerInfo, { exact: true }),
  bSupersonic: Schema.optionalWith(Schema.Boolean, { exact: true }),
  PickupClass: Schema.optionalWith(Schema.String, { exact: true })
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

export type UpdateStatePlayerType = Schema.Schema.Type<typeof UpdateStatePlayer>
export type UpdateStateTeamType = Schema.Schema.Type<typeof UpdateStateTeam>
export type UpdateStateBallType = Schema.Schema.Type<typeof UpdateStateBall>
export type UpdateStateGameType = Schema.Schema.Type<typeof UpdateStateGame>
export type UpdateStateDataType = Schema.Schema.Type<typeof UpdateStateData>

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

export type GoalScoredDataType = Schema.Schema.Type<typeof GoalScoredData>

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

export type BallHitDataType = Schema.Schema.Type<typeof BallHitData>

// ============================================================================
// ClockUpdatedSeconds Event Data
// ============================================================================

export const ClockUpdatedSecondsData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  TimeSeconds: Schema.Number,
  bOvertime: Schema.Boolean
})

export type ClockUpdatedSecondsDataType = Schema.Schema.Type<typeof ClockUpdatedSecondsData>

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
export const ReplayCreatedData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  FileName: Schema.String,
  Date: Schema.Date
})

export type CountdownBeginDataType = Schema.Schema.Type<typeof CountdownBeginData>
export type RoundStartedDataType = Schema.Schema.Type<typeof RoundStartedData>
export type MatchCreatedDataType = Schema.Schema.Type<typeof MatchCreatedData>
export type MatchDestroyedDataType = Schema.Schema.Type<typeof MatchDestroyedData>
export type MatchPausedDataType = Schema.Schema.Type<typeof MatchPausedData>
export type MatchUnpausedDataType = Schema.Schema.Type<typeof MatchUnpausedData>
export type GoalReplayStartDataType = Schema.Schema.Type<typeof GoalReplayStartData>
export type GoalReplayEndDataType = Schema.Schema.Type<typeof GoalReplayEndData>
export type GoalReplayWillEndDataType = Schema.Schema.Type<typeof GoalReplayWillEndData>
export type PodiumStartDataType = Schema.Schema.Type<typeof PodiumStartData>
export type ReplayCreatedDataType = Schema.Schema.Type<typeof ReplayCreatedData>

// ============================================================================
// MatchInitialized (MatchGuid is REQUIRED)
// ============================================================================

export const MatchInitializedData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true })
})

export type MatchInitializedDataType = Schema.Schema.Type<typeof MatchInitializedData>

// ============================================================================
// MatchEnded Event Data
// ============================================================================

export const MatchEndedData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  WinnerTeamNum: Schema.Number
})

export type MatchEndedDataType = Schema.Schema.Type<typeof MatchEndedData>

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

export type StatfeedEventDataType = Schema.Schema.Type<typeof StatfeedEventData>

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

export type CrossbarHitDataType = Schema.Schema.Type<typeof CrossbarHitData>

// ============================================================================
// BoostPickup Event Data
// ============================================================================

export const BoostPickupData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  Player: PlayerInfo,
  Location: Position3D,
  BoostAmount: Schema.Number,
  BoostType: Schema.String,
  bReplay: Schema.Boolean
})

export type BoostPickupDataType = Schema.Schema.Type<typeof BoostPickupData>

// ============================================================================
// PlayerJoined Event Data
// ============================================================================

export const PlayerJoinedData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  PlayerName: Schema.String,
  PrimaryId: PrimaryId
})

export type PlayerJoinedDataType = Schema.Schema.Type<typeof PlayerJoinedData>

// ============================================================================
// PlayerLeft Event Data
// ============================================================================

export const PlayerLeftData = Schema.Struct({
  MatchGuid: Schema.optionalWith(Schema.String, { exact: true }),
  PlayerName: Schema.String,
  PrimaryId: PrimaryId
})

export type PlayerLeftDataType = Schema.Schema.Type<typeof PlayerLeftData>

// ============================================================================
// Wrapper Schemas (Event + Data)
// ============================================================================

export const UpdateStateSchema = Schema.Struct({
  Event: Schema.Literal('UpdateState'),
  Data: UpdateStateData
})
export const GoalScoredSchema = Schema.Struct({
  Event: Schema.Literal('GoalScored'),
  Data: GoalScoredData
})
export const BallHitSchema = Schema.Struct({ Event: Schema.Literal('BallHit'), Data: BallHitData })
export const ClockUpdatedSecondsSchema = Schema.Struct({
  Event: Schema.Literal('ClockUpdatedSeconds'),
  Data: ClockUpdatedSecondsData
})
export const CountdownBeginSchema = Schema.Struct({
  Event: Schema.Literal('CountdownBegin'),
  Data: CountdownBeginData
})
export const RoundStartedSchema = Schema.Struct({
  Event: Schema.Literal('RoundStarted'),
  Data: RoundStartedData
})
export const MatchCreatedSchema = Schema.Struct({
  Event: Schema.Literal('MatchCreated'),
  Data: MatchCreatedData
})
export const MatchInitializedSchema = Schema.Struct({
  Event: Schema.Literal('MatchInitialized'),
  Data: MatchInitializedData
})
export const MatchEndedSchema = Schema.Struct({
  Event: Schema.Literal('MatchEnded'),
  Data: MatchEndedData
})
export const MatchDestroyedSchema = Schema.Struct({
  Event: Schema.Literal('MatchDestroyed'),
  Data: MatchDestroyedData
})
export const MatchPausedSchema = Schema.Struct({
  Event: Schema.Literal('MatchPaused'),
  Data: MatchPausedData
})
export const MatchUnpausedSchema = Schema.Struct({
  Event: Schema.Literal('MatchUnpaused'),
  Data: MatchUnpausedData
})
export const StatfeedEventSchema = Schema.Struct({
  Event: Schema.Literal('StatfeedEvent'),
  Data: StatfeedEventData
})
export const CrossbarHitSchema = Schema.Struct({
  Event: Schema.Literal('CrossbarHit'),
  Data: CrossbarHitData
})
export const GoalReplayStartSchema = Schema.Struct({
  Event: Schema.Literal('GoalReplayStart'),
  Data: GoalReplayStartData
})
export const GoalReplayEndSchema = Schema.Struct({
  Event: Schema.Literal('GoalReplayEnd'),
  Data: GoalReplayEndData
})
export const GoalReplayWillEndSchema = Schema.Struct({
  Event: Schema.Literal('GoalReplayWillEnd'),
  Data: GoalReplayWillEndData
})
export const PodiumStartSchema = Schema.Struct({
  Event: Schema.Literal('PodiumStart'),
  Data: PodiumStartData
})
export const ReplayCreatedSchema = Schema.Struct({
  Event: Schema.Literal('ReplayCreated'),
  Data: ReplayCreatedData
})
export const BoostPickupSchema = Schema.Struct({
  Event: Schema.Literal('BoostPickup'),
  Data: BoostPickupData
})
export const PlayerJoinedSchema = Schema.Struct({
  Event: Schema.Literal('PlayerJoined'),
  Data: PlayerJoinedData
})
export const PlayerLeftSchema = Schema.Struct({
  Event: Schema.Literal('PlayerLeft'),
  Data: PlayerLeftData
})

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
  ReplayCreatedSchema,
  BoostPickupSchema,
  PlayerJoinedSchema,
  PlayerLeftSchema
)

export type AllEventsType = Schema.Schema.Type<typeof AllEvents>
