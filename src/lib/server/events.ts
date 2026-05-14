import { EventEmitter } from 'events'

class ATVHub extends EventEmitter {}

const g = globalThis as unknown as { __atvHub?: ATVHub }
export const atvHub: ATVHub = g.__atvHub ?? (g.__atvHub = new ATVHub())
atvHub.setMaxListeners(0)
