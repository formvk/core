import type { SchemaPatch } from './types'

const patches: SchemaPatch[] = []
export const reducePatches = (schema: any) => {
  return patches.reduce(
    (buf, patch) => {
      return patch(buf)
    },
    { ...schema }
  )
}
