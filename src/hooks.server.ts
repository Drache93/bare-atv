import type { Handle } from '@sveltejs/kit'
import { warmAtv } from '$lib/server/atv'
import * as wifi from '#wifi'
import process from 'process'

wifi.acquireMulticastLock('bare-atv')
process.on('exit', () => wifi.releaseMulticastLock())

warmAtv()

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event)
}
