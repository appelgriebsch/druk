import { EventEmitter } from 'node:events'

import { divertWarnings } from '../../src/core/warnings'

divertWarnings(process.argv[2])
const emitter = new EventEmitter()
for (let n = 0; n <= emitter.getMaxListeners(); n++) emitter.on('x', () => {})
await new Promise(resolve => setTimeout(resolve, 20))
