import type { Handle } from '@sveltejs/kit'
import { warmAtv } from '$lib/server/atv'

warmAtv()

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event)
}
