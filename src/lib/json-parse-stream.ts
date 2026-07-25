// @ts-nocheck
import { Transform } from 'streamx'

export default class ParseJSONStream extends Transform {
  _workingString

  constructor() {
    super({
      transform(jsonString, cb) {
        this._workingString += jsonString.toString()
        try {
          const obj = JSON.parse(this._workingString)
          this.push(obj)
          this._workingString = ''
        } catch {
          let i = 0
          while (i <= this._workingString.length) {
            try {
              const startChar = this._workingString[0]
              const oppositeChar =
                startChar === '[' ? ']' : startChar === '{' ? '}' : null

              i = this._workingString.indexOf(oppositeChar, i)
              if (i === -1) break
              i++

              const str = this._workingString.substring(0, i)
              const obj = JSON.parse(str)

              this.push(obj)
              this._workingString = this._workingString.substring(i)
              i = 0
            } catch {
              i++
            }
          }
        }
        cb(null)
      }
    })
    this._workingString = ''
  }
}
