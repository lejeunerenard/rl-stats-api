// Rocket League Stats API event type definitions
// Based on the official specification: https://www.rocketleague.com/developer/stats-api

// ============================================================================
// Shared Types
// ============================================================================

export interface PlayerInfo {
  Name: string
  Shortcut: number
  TeamNum: number
}

export interface Position3D {
  X: number
  Y: number
  Z: number
}

export interface Rotation3D {
  Pitch: number
  Yaw: number
  Roll: number
}

export interface Velocity {
  X: number
  Y: number
  Z: number
}

export interface DemoInfo {
  Demolisher: PlayerInfo
  Victim: PlayerInfo
}

// ============================================================================
// UpdateState Event
// ============================================================================

export interface UpdateStatePlayer {
  Name: string
  PrimaryId: string
  Shortcut: number
  TeamNum: number
  Score: number
  Goals: number
  Shots: number
  Assists: number
  Saves: number
  Touches: number
  CarTouches: number
  Demos: number
  bHasCar: boolean
  Speed: number
  Boost: number
  bBoosting: boolean
  bOnGround: boolean
  bOnWall: boolean
  bPowersliding: boolean
  bDemolished: boolean
  Attacker?: PlayerInfo
  bSupersonic: boolean
  Demo?: DemoInfo
  Replay?: {
    ReplayIndex: number
    ReplayName: string
  }
  Spectator?: {
    SpectatorIndex: number
    SpectatorName: string
  }
  bIsAutoAimed: boolean
  bIsAutoAiming: boolean
  bIsOnTeam: boolean
  bIsSpectating: boolean
  bIsTeamMate: boolean
  bIsTeamMateAutoAimed: boolean
  bIsTeamMateAutoAiming: boolean
  bIsTeamMateSpectating: boolean
  bIsTeamMateTeamMate: boolean
  bIsTeamMateVisible: boolean
  bIsVisible: boolean
  bIsWorking: boolean
  bIsWorkingForTeam: boolean
  bIsWorkingForTeamMate: boolean
  bIsWorkingForOpponent: boolean
  bIsWorkingForOpponentAutoAimed: boolean
  bIsWorkingForOpponentAutoAiming: boolean
  bIsWorkingForOpponentSpectating: boolean
  bIsWorkingForOpponentTeamMate: boolean
  bIsWorkingForOpponentVisible: boolean
  bIsWorkingForSelf: boolean
  bIsWorkingForSelfAutoAimed: boolean
  bIsWorkingForSelfAutoAiming: boolean
  bIsWorkingForSelfSpectating: boolean
  bIsWorkingForSelfTeamMate: boolean
  bIsWorkingForSelfVisible: boolean
  bIsWorkingForTeam: boolean
  bIsWorkingForTeamAutoAimed: boolean
  bIsWorkingForTeamAutoAiming: boolean
  bIsWorkingForTeamSpectating: boolean
  bIsWorkingForTeamTeamMate: boolean
  bIsWorkingForTeamVisible: boolean
}

export interface UpdateStateTeam {
  Name: string
  TeamNum: number
  Score: number
  ColorPrimary: string
  ColorSecondary: string
  Replay?: {
    ReplayIndex: number
    ReplayName: string
  }
}

export interface UpdateStateBall {
  Speed: number
  TeamNum: number
  Location?: Position3D
  Velocity?: Velocity
  AngularVelocity?: Velocity
}

export interface UpdateStateGame {
  Teams: UpdateStateTeam[]
  TimeSeconds: number
  bOvertime: boolean
  Frame: number
  Elapsed: number
  Ball: UpdateStateBall
  bReplay: boolean
  bHasWinner: boolean
  Winner?: string
  Arena: string
  bHasTarget: boolean
  Target?: PlayerInfo
}

export interface UpdateStateData {
  Event: 'UpdateState'
  Data: {
    MatchGuid?: string
    Players: UpdateStatePlayer[]
    Game: UpdateStateGame
  }
}

// ============================================================================
// GoalScored Event
// ============================================================================

export interface GoalScoredData {
  Event: 'GoalScored'
  Data: {
    MatchGuid?: string
    Scorer: PlayerInfo
    Assister?: PlayerInfo
    GoalSpeed: number
    GoalTime: number
    ImpactLocation: Position3D
  }
}

// ============================================================================
// BallHit Event
// ============================================================================

export interface BallHitData {
  Event: 'BallHit'
  Data: {
    Players: PlayerInfo[]
    Ball: {
      PreHitSpeed: number
      PostHitSpeed: number
      Location: Position3D
    }
  }
}

// ============================================================================
// ClockUpdatedSeconds Event
// ============================================================================

export interface ClockUpdatedSecondsData {
  Event: 'ClockUpdatedSeconds'
  Data: {
    TimeSeconds: number
    bOvertime: boolean
  }
}

// ============================================================================
// CountdownBegin Event
// ============================================================================

export interface CountdownBeginData {
  Event: 'CountdownBegin'
  Data: {
    MatchGuid?: string
  }
}

// ============================================================================
// RoundStarted Event
// ============================================================================

export interface RoundStartedData {
  Event: 'RoundStarted'
  Data: {
    MatchGuid?: string
  }
}

// ============================================================================
// MatchCreated Event
// ============================================================================

export interface MatchCreatedData {
  Event: 'MatchCreated'
  Data: {
    MatchGuid: string
    MatchType: string
    GameMode: string
    MapName: string
    TeamSize: number
    bIsRanked: boolean
    bIsTournament: boolean
    bIsMatchmaking: boolean
    Teams: {
      TeamNum: number
      Name: string
      ColorPrimary: string
      ColorSecondary: string
    }[]
  }
}

// ============================================================================
// MatchInitialized Event
// ============================================================================

export interface MatchInitializedData {
  Event: 'MatchInitialized'
  Data: {
    MatchGuid: string
  }
}

// ============================================================================
// MatchEnded Event
// ============================================================================

export interface MatchEndedData {
  Event: 'MatchEnded'
  Data: {
    MatchGuid?: string
    WinnerTeamNum: number
    ScoreByTeam: {
      TeamNum: number
      Score: number
    }[]
  }
}

// ============================================================================
// MatchDestroyed Event
// ============================================================================

export interface MatchDestroyedData {
  Event: 'MatchDestroyed'
  Data: {
    MatchGuid?: string
  }
}

// ============================================================================
// MatchPaused / MatchUnpaused Events
// ============================================================================

export interface MatchPausedData {
  Event: 'MatchPaused'
  Data: {
    MatchGuid?: string
  }
}

export interface MatchUnpausedData {
  Event: 'MatchUnpaused'
  Data: {
    MatchGuid?: string
  }
}

// ============================================================================
// StatfeedEvent
// ============================================================================

export interface StatfeedEventData {
  Event: 'StatfeedEvent'
  Data: {
    EventName: string
    Type: string
    MainTarget: PlayerInfo
    SecondaryTarget?: PlayerInfo
  }
}

// ============================================================================
// CrossbarHit Event
// ============================================================================

export interface CrossbarHitData {
  Event: 'CrossbarHit'
  Data: {
    MatchGuid?: string
    Player: PlayerInfo
    BallSpeed: number
    ImpactLocation: Position3D
  }
}

// ============================================================================
// GoalReplay Events
// ============================================================================

export interface GoalReplayStartData {
  Event: 'GoalReplayStart'
  Data: {
    MatchGuid?: string
    Scorer: PlayerInfo
    Assister?: PlayerInfo
    GoalSpeed: number
    GoalTime: number
    ImpactLocation: Position3D
  }
}

export interface GoalReplayEndData {
  Event: 'GoalReplayEnd'
  Data: {
    MatchGuid?: string
  }
}

export interface GoalReplayWillEndData {
  Event: 'GoalReplayWillEnd'
  Data: {
    MatchGuid?: string
  }
}

// ============================================================================
// PodiumStart Event
// ============================================================================

export interface PodiumStartData {
  Event: 'PodiumStart'
  Data: {
    MatchGuid?: string
  }
}

// ============================================================================
// ReplayCreated Event
// ============================================================================

export interface ReplayCreatedData {
  Event: 'ReplayCreated'
  Data: {
    MatchGuid: string
    ReplayIndex: number
    ReplayName: string
  }
}

// ============================================================================
// Connection Events
// ============================================================================

export interface ConnectionErrorData {
  Event: 'connection:error'
  Data: Error
}

// ============================================================================
// Event Map
// ============================================================================

export interface RLStatsEventMap {
  connected: []
  'connection:error': [Error]
  UpdateState: [UpdateStateData]
  GoalScored: [GoalScoredData]
  BallHit: [BallHitData]
  ClockUpdatedSeconds: [ClockUpdatedSecondsData]
  CountdownBegin: [CountdownBeginData]
  RoundStarted: [RoundStartedData]
  MatchCreated: [MatchCreatedData]
  MatchInitialized: [MatchInitializedData]
  MatchEnded: [MatchEndedData]
  MatchDestroyed: [MatchDestroyedData]
  MatchPaused: [MatchPausedData]
  MatchUnpaused: [MatchUnpausedData]
  StatfeedEvent: [StatfeedEventData]
  CrossbarHit: [CrossbarHitData]
  GoalReplayStart: [GoalReplayStartData]
  GoalReplayEnd: [GoalReplayEndData]
  GoalReplayWillEnd: [GoalReplayWillEndData]
  PodiumStart: [PodiumStartData]
  ReplayCreated: [ReplayCreatedData]
}
