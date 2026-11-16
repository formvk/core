import { useField } from '@formvk/vue'
import { computed } from 'vue'

/**
 * Reads the surrounding `@formvk` field, so demo controls can render the
 * schema-driven label, required marker and validation errors.
 */
export function useDemoField() {
  const field = useField()

  return {
    field,
    title: computed(() => (field.value as any)?.title as string | undefined),
    description: computed(() => (field.value as any)?.description as string | undefined),
    required: computed(() => !!(field.value as any)?.required),
    errors: computed(() => ((field.value as any)?.selfErrors ?? []) as string[]),
  }
}
