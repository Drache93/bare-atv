import AppleTVRemote from 'bare-appletv-remote'
import path from 'path'
import dir from 'bare-storage'

import { atvHub } from './events'

type Remote = InstanceType<typeof AppleTVRemote>

type AtvState =
  | { type: 'ready'; name?: string }
  | { type: 'pinNeeded' }
  | { type: 'error'; message: string }
  | null

// All state pinned to globalThis so hot-reloads don't orphan instances
const g = globalThis as unknown as {
  __atv?: Remote
  __atvPin?: ((pin: string) => void) | null
  __atvState?: AtvState
}

export function getAtvState(): AtvState {
  return g.__atvState ?? null
}

function makeRemote(): Remote {
  const remote = new AppleTVRemote({
    credentialsFile: path.join(dir.persistent(), 'credentials.json'),
    onpin: () => {
      g.__atvState = { type: 'pinNeeded' }
      atvHub.emit('pinNeeded')
      return new Promise<string>((resolve) => {
        g.__atvPin = resolve
      })
    }
  })
  remote.on('error', () => {}) // prevent unhandled error event from crashing Bare
  return remote
}

function getRemote(): Remote {
  if (!g.__atv) g.__atv = makeRemote()
  return g.__atv
}

function resetRemote(): void {
  g.__atv = undefined
  g.__atvPin = null
}

export function submitPin(pin: string): void {
  g.__atvPin?.(pin)
  g.__atvPin = null
}

export function warmAtv(): void {
  const remote = getRemote()
  const timer = setTimeout(() => {
    resetRemote()
    g.__atvState = {
      type: 'error',
      message: 'Connection timed out — check device is on the same network'
    }
    atvHub.emit('atvError', { message: (g.__atvState as { message: string }).message })
  }, 30_000)
  remote
    .ready()
    .then(() => {
      clearTimeout(timer)
      g.__atvState = { type: 'ready', name: remote.name ?? undefined }
      atvHub.emit('status', { paired: true, name: remote.name })
    })
    .catch((err: Error) => {
      clearTimeout(timer)
      resetRemote()
      g.__atvState = { type: 'error', message: err.message }
      atvHub.emit('atvError', { message: err.message })
    })
}

export function retryAtv(): void {
  resetRemote()
  g.__atvState = null
  warmAtv()
}

export async function sendPlayPause(): Promise<void> {
  await getRemote().playPause()
}

export async function sendBack(): Promise<void> {
  await getRemote().back()
}

export async function sendVolumeUp(): Promise<void> {
  await getRemote().volumeUp()
}

export async function sendVolumeDown(): Promise<void> {
  await getRemote().volumeDown()
}

export async function sendClick(): Promise<void> {
  await getRemote().click()
}

export async function sendUp(): Promise<void> {
  await getRemote().up()
}

export async function sendDown(): Promise<void> {
  await getRemote().down()
}

export async function sendLeft(): Promise<void> {
  await getRemote().left()
}

export async function sendRight(): Promise<void> {
  await getRemote().right()
}

export async function sendHome(): Promise<void> {
  await (getRemote() as any).home()
}

export async function sendSettings(): Promise<void> {
  await (getRemote() as any).settings()
}

export async function sendSwipe(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
  await getRemote().swipe(direction)
}
