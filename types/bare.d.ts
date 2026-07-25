// Ambient declarations for bare-net
// bare-net provides its own .d.ts, but TypeScript needs to know about it
// when compiling with the conditional imports from package.json

declare module 'bare-net' {
  import { EventEmitter } from 'events'

  interface TcpSocketEvents {
    close: []
    connect: []
    connection: [socket: TcpSocket]
    error: [err: Error]
    lookup: [err: Error | null, address: string, family: number, host: string]
    ready: []
    timeout: []
  }

  class TcpSocket extends EventEmitter<TcpSocketEvents> {
    constructor()
    connect(port: number, host: string, callback?: () => void): this
    setNoDelay(noDelay?: boolean): this
    setKeepAlive(enable?: boolean, initialDelay?: number): this
    destroy(err?: Error): this
    readonly destroyed: boolean
    readonly connecting: boolean
    readonly writable: boolean
    readonly readable: boolean
    readonly localPort?: number
    readonly localAddress?: string
    readonly remotePort?: number
    readonly remoteAddress?: string
    readonly remoteFamily?: string
    readonly bytesRead: number
    readonly bytesWritten: number
  }

  function createConnection(port: number, host: string, callback?: () => void): TcpSocket
}
