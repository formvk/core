import { isFn } from '@formvk/shared'

import type { SchemaPatch } from './types'

const patches: SchemaPatch[] = []

export function reducePatches(schema: any) {
  return patches.reduce(
    (buf, patch) => {
      return patch(buf)
    },
    { ...schema }
  )
}

export function registerPatches(...args: SchemaPatch[]) {
  args.forEach(patch => {
    if (isFn(patch)) {
      patches.push(patch)
    }
  })
}
