import type { Schema } from '@formvk/schema'
import { useContext } from 'react'

import { SchemaContext } from '../shared/context'

export function useFieldSchema(): Schema | undefined {
  return useContext(SchemaContext)
}
