import type { ComponentProps } from '@formvk/vue'

import DemoArrayItems from './DemoArrayItems.vue'
import DemoCheckbox from './DemoCheckbox.vue'
import DemoInput from './DemoInput.vue'
import DemoSelect from './DemoSelect.vue'
import DemoTextarea from './DemoTextarea.vue'

const fieldComponents = {
  Input: DemoInput,
  NumberInput: DemoInput,
  Select: DemoSelect,
  Checkbox: DemoCheckbox,
  Textarea: DemoTextarea,
}

const arrayComponents = {
  ArrayItems: DemoArrayItems,
}

/** Components registered on every `SchemaField` demo in these docs. */
export const demoComponents = { ...fieldComponents, ...arrayComponents }

/** Component props inferred from the demo components. */
export type DemoComponents = {
  field: { [K in keyof typeof fieldComponents]: ComponentProps<(typeof fieldComponents)[K]> }
  array: { [K in keyof typeof arrayComponents]: ComponentProps<(typeof arrayComponents)[K]> }
}

export { DemoArrayItems, DemoCheckbox, DemoInput, DemoSelect, DemoTextarea }
