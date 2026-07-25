// @ts-nocheck
import { Effect, Exit, Option } from "effect"
import { decodeEventStrict } from "../schema/decode.js"

export function extractOneObject(working: string): Option<{ parsed: unknown; remainder: string }> {
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
          return Option.some({ parsed: obj, remainder: working.substring(i + 1) })
        }
        catch {
          return Option.none()
        }
      }
    }
  }

  return Option.none()
}

export interface ParsedEvent {
  type: 'event'
  event: string
  data: unknown
}

export interface SchemaError {
  type: 'error'
  error: unknown
}

export type ParseResult = ParsedEvent | SchemaError

export function decodeAndParse(str: string): { results: ParseResult[]; remainder: string } {
  const results: ParseResult[] = []
  let buffer = str

  while (true) {
    const result = extractOneObject(buffer)
    if (!Option.isSome(result)) break

    const { parsed, remainder } = result.value
    buffer = remainder

    const exit = Effect.runSyncExit(decodeEventStrict(parsed))
    if (Exit.isSuccess(exit)) {
      const event = exit.value
      results.push({ type: 'event', event: event.Event, data: event.Data })
    }
    else {
      results.push({ type: 'error', error: exit.cause })
    }
  }

  return { results, remainder: buffer }
}
