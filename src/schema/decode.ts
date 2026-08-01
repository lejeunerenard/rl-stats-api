import { Effect, Schema, ParseResult, Either } from "effect"
import { AllEvents, type AllEventsType } from "./events.js"

export const decodeEvent = (input: unknown): Effect.Effect<AllEventsType, ParseResult.ParseError> =>
  Schema.decodeUnknown(AllEvents)(input)

export const decodeEventStrict = (input: unknown): Effect.Effect<AllEventsType, ParseResult.ParseError> =>
  Schema.decodeUnknown(AllEvents)(input, { onExcessProperty: "error" })

export const decodeEventEither = Schema.decodeUnknownEither(AllEvents)

export const decodeEventEitherStrict = (input: unknown): Either.Either<AllEventsType, ParseResult.ParseError> =>
  Schema.decodeUnknownEither(AllEvents)(input, { onExcessProperty: "error" })
