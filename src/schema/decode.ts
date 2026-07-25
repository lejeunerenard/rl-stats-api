// @ts-nocheck
import { Effect, Schema } from "effect"
import { AllEvents } from "./events.js"

export const decodeEvent = (input: unknown): Effect.Effect<typeof AllEvents.Type, Schema.ParseError> =>
  Schema.decodeUnknown(AllEvents)(input)

export const decodeEventStrict = (input: unknown): Effect.Effect<typeof AllEvents.Type, Schema.ParseError> =>
  Schema.decodeUnknown(AllEvents)(input, { onExcessProperty: "error" })

export const decodeEventSync = (input: unknown): Effect.Either<Schema.ParseError, typeof AllEvents.Type> =>
  Schema.decodeUnknownEither(AllEvents)(input)
