// Ambient declaration for ready-resource
// Mirrors the shape of the package's own .d.ts file

declare module 'ready-resource' {
  import { EventEmitter } from 'events'

  class ReadyResource extends EventEmitter {
    constructor()

    opening: Promise<void> | null
    closing: Promise<void> | null
    opened: boolean
    closed: boolean

    ready(): Promise<void>
    close(): Promise<void>

    protected _open(): Promise<void>
    protected _close(): Promise<void>

    on(event: 'ready', listener: () => void): this
    on(event: 'close', listener: () => void): this
    once(event: 'ready', listener: () => void): this
    once(event: 'close', listener: () => void): this
    off(event: 'ready', listener: () => void): this
    off(event: 'close', listener: () => void): this
    emit(event: 'ready'): boolean
    emit(event: 'close'): boolean

    // Fallback EventEmitter overloads
    on(event: string | symbol, listener: (...args: any[]) => void): this
    once(event: string | symbol, listener: (...args: any[]) => void): this
    off(event: string | symbol, listener: (...args: any[]) => void): this
    emit(event: string | symbol, ...args: any[]): boolean
  }

  export = ReadyResource
}
