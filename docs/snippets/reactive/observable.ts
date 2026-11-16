import { observable } from '@formvk/reactive'

const state = observable({ count: 0, step: 1 })

state.count += state.step
