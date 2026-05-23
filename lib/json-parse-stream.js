const { Transform } = require('streamx')

module.exports = class ParseJSONStream extends Transform {
  constructor() {
    super({
      transform(jsonString, cb) {
        this._workingString += jsonString.toString()
        try {
          const obj = JSON.parse(this._workingString)
          this.push(obj)
          this._workingString = ''
        } catch (err) {
          let i = 0
          while (i <= this._workingString.length) {
            try {
              // Jump to opposite character
              const startChar = this._workingString[0]
              const oppositeChar = startChar === '[' ? ']' : startChar === '{' ? '}' : null

              i = this._workingString.indexOf(oppositeChar, i)
              if (i === -1) break // didnt find it
              i++ // bump so range is now includes the character

              const str = this._workingString.substring(0, i)
              const obj = JSON.parse(str)

              this.push(obj)
              this._workingString = this._workingString.substring(i)
              i = 0
            } catch {}
            i++
          }
        }
        cb()
      }
    })
    this._workingString = ''
  }
}
