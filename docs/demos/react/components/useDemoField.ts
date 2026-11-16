import type { Field } from '@formvk/core'
import { useField } from '@formvk/react'

/**
 * Reads the current @formvk field context, so demo controls can render the
 * schema-driven title, required marker and validation errors.
 *
 * Demo controls are only mounted as field components (VoidField never injects
 * data controls), so the generic is narrowed to Field: selfErrors / required /
 * dataSource and other data-field props all live on that type. Consuming
 * components still need the observer wrapper to react to changes.
 */
export function useDemoField(): Field | undefined {
  return useField<Field>()
}
