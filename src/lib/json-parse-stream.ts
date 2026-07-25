// @ts-nocheck
import { Chunk, Effect, Option, Stream } from "effect"

function extractOneObject(working: string): Option<{ parsed: unknown; remainder: string }> {
  if (working.length === 0) return Option.none()
  let i = 0
  while (i <= working.length) {
    const startChar = working[0]
    const oppositeChar = startChar === '[' ? ']' : startChar === '{' ? '}' : null
    if (!oppositeChar) break
    i = working.indexOf(oppositeChar, i)
    if (i === -1) break
    i++
    const str = working.substring(0, i)
    try {
      const obj = JSON.parse(str)
      return Option.some({ parsed: obj, remainder: working.substring(i) })
    }
    catch {
      i++
    }
  }
  return Option.none()
}

export function parseJsonStream(): Stream.Stream<unknown, never, never> {
  return Stream.unfoldEffect({ buffer: "" }, (state) =>
    Effect.succeed(
      Option.match(state.buffer, {
        onNone: () => Option.none(),
        onSome: (buf) => {
          const result = extractOneObject(buf)
          return Option.match(result, {
            onNone: () => Option.none(),
            onSome: ({ parsed, remainder }) => Option.some([Chunk.of(parsed), { buffer: remainder }])
          })
        }
      })
    )
  )
}
