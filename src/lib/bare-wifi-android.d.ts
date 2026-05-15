declare module '#wifi' {
  export function acquireMulticastLock(tag?: string): void
  export function releaseMulticastLock(): void
  export function getWifiIP(): string | null
}
