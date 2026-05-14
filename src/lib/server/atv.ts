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

function getRemote(): Remote {
  if (g.__atv) return g.__atv
  g.__atv = new AppleTVRemote({
    credentialsFile: path.join(dir.persistent(), 'credentials.json'),
    host: '192.168.178.59',
    port: 49153,
    onpin: () => {
      g.__atvState = { type: 'pinNeeded' }
      atvHub.emit('pinNeeded')
      return new Promise<string>((resolve) => {
        g.__atvPin = resolve
      })
    }
  })
  return g.__atv
}

export function submitPin(pin: string): void {
  g.__atvPin?.(pin)
  g.__atvPin = null
}

export function warmAtv(): void {
  const remote = getRemote()
  remote
    .ready()
    .then(() => {
      g.__atvState = { type: 'ready', name: remote.name ?? undefined }
      atvHub.emit('status', { paired: true, name: remote.name })
    })
    .catch((err: Error) => {
      g.__atvState = { type: 'error', message: err.message }
      atvHub.emit('atvError', { message: err.message })
    })
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

export async function sendSwipe(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
  await getRemote().swipe(direction)
}
