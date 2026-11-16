import { createFragment } from '@formvk/schema'

export const f = createFragment({
  patches: [
    schema => ({ ...schema, 'x-region': 'cn' }),
    { pre: true, patch: schema => ({ ...schema, 'x-source': 'formvk' }) },
  ],
})
