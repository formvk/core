import type { Schema } from '@formvk/schema'
import { inject, ref } from 'vue'
import type { Ref } from 'vue'

import { SchemaSymbol } from '../shared/context'

export function useFieldSchema(): Ref<Schema> {
  return inject(SchemaSymbol, ref()) as Ref<Schema>
}
