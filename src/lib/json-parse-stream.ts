import { Effect, Either, Option, pipe, ParseResult } from 'effect'
import { decodeEventEitherStrict } from '../schema/decode.js'
import type { AllEventsType } from "../schema/events.js"

interface ExtractedObject {
  parsed: unknown
  raw: string
  remainder: string
}

export function extractOneObject(working: string): Option.Option<ExtractedObject> {
  if (working.length === 0) return Option.none()

  let start = 0
  while (start < working.length && /\s/.test(working[start])) {
    start++
  }
  if (start === working.length) return Option.none()

  const startChar = working[start]
  const endChar = startChar === '[' ? ']' : startChar === '{' ? '}' : null
  if (!endChar) return Option.none()

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < working.length; i++) {
    const char = working[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === '\\' && inString) {
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === '{' || char === '[') {
      depth++
    } else if (char === '}' || char === ']') {
      depth--
      if (depth === 0) {
        const str = working.substring(0, i + 1)
        try {
          const obj = JSON.parse(str)
          return Option.some({ parsed: obj, raw: str, remainder: working.substring(i + 1) })
        } catch {
          return Option.none()
        }
      }
    }
  }

  return Option.none()
}

interface EventResult {
  type: 'event'
  event: string
  data: unknown
}

function normalizeEventData(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw
  const obj = raw as Record<string, unknown>
  if (typeof obj.Data === 'string') {
    try {
      obj.Data = JSON.parse(obj.Data)
    } catch {
      // If Data string isn't valid JSON, leave it as-is — schema will reject it
    }
  }
  return obj
}

export function decodeAndParse(str: string): { results: Either.Either<AllEventsType, ParseResult.ParseError>[]; remainder: string } {
  const results: Either.Either<AllEventsType, ParseResult.ParseError>[] = []
  let buffer = str

  while (true) {
    const result = extractOneObject(buffer)
    if (!Option.isSome(result)) break

    const { parsed, raw, remainder } = result.value
    buffer = remainder

    const normalized = normalizeEventData(parsed)
    const asEitherEvent = decodeEventEitherStrict(normalized)
    results.push(asEitherEvent)
  }

  return { results, remainder: buffer }
}
