import type { Actions } from './$types'
import {
  retryAtv,
  sendBack,
  sendClick,
  sendDown,
  sendHome,
  sendLeft,
  sendPlayPause,
  sendRight,
  sendSettings,
  sendSwipe,
  sendUp,
  sendVolumeDown,
  sendVolumeUp,
  submitPin
} from '$lib/server/atv'

export const actions = {
  playPause: async () => {
    await sendPlayPause()
    return { ok: true }
  },
  back: async () => {
    await sendBack()
    return { ok: true }
  },
  volumeUp: async () => {
    await sendVolumeUp()
    return { ok: true }
  },
  volumeDown: async () => {
    await sendVolumeDown()
    return { ok: true }
  },
  click: async () => {
    await sendClick()
    return { ok: true }
  },
  up: async () => {
    await sendUp()
    return { ok: true }
  },
  down: async () => {
    await sendDown()
    return { ok: true }
  },
  left: async () => {
    await sendLeft()
    return { ok: true }
  },
  right: async () => {
    await sendRight()
    return { ok: true }
  },
  swipe: async ({ request }) => {
    const data = await request.formData()
    const direction = String(data.get('direction')) as 'up' | 'down' | 'left' | 'right'
    await sendSwipe(direction)
    return { ok: true }
  },
  home: async () => {
    await sendHome()
    return { ok: true }
  },
  settings: async () => {
    await sendSettings()
    return { ok: true }
  },
  retry: async () => {
    retryAtv()
    return { ok: true }
  },
  submitPin: async ({ request }) => {
    const data = await request.formData()
    const pin = String(data.get('pin') ?? '').trim()
    submitPin(pin)
    return { ok: true }
  }
} satisfies Actions
