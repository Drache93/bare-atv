import type { RequestHandler } from './$types'
import { atvHub } from '$lib/server/events'
import { getAtvState } from '$lib/server/atv'

export const GET: RequestHandler = () => {
  const encoder = new TextEncoder()
  let onPinNeeded: (() => void) | null = null
  let onStatus: ((p: unknown) => void) | null = null
  let onError: ((p: unknown) => void) | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      const send = (event: string, data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      onPinNeeded = () => send('pinNeeded', {})
      onStatus = (p) => send('status', p)
      onError = (p) => send('atvError', p)

      atvHub.on('pinNeeded', onPinNeeded)
      atvHub.on('status', onStatus)
      atvHub.on('atvError', onError)

      // Android WebView buffers SSE until ~4KB — flush it immediately
      controller.enqueue(encoder.encode(': ' + ' '.repeat(2048) + '\n\n'))

      // Replay current state so late-connecting clients don't stay stuck
      const current = getAtvState()
      if (current?.type === 'ready') send('status', { paired: true, name: current.name })
      else if (current?.type === 'pinNeeded') send('pinNeeded', {})
      else if (current?.type === 'error') send('atvError', { message: current.message })

      heartbeat = setInterval(() => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          closed = true
        }
      }, 30_000)
    },
    cancel() {
      if (onPinNeeded) atvHub.off('pinNeeded', onPinNeeded)
      if (onStatus) atvHub.off('status', onStatus)
      if (onError) atvHub.off('atvError', onError)
      if (heartbeat) clearInterval(heartbeat)
    }
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no'
    }
  })
}
