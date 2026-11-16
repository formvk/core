import { DemoArrayItems } from './DemoArrayItems'
import { DemoCheckbox } from './DemoCheckbox'
import { DemoInput } from './DemoInput'
import { DemoSelect } from './DemoSelect'
import { DemoTextarea } from './DemoTextarea'

/**
 * Flat name → component map: passed to createSchemaField for fragment type
 * inference. Unclassified components default to field components; ArrayItems
 * is an array component, classified separately via the factory's
 * arrayComponents and merged into the runtime map automatically.
 */
export const demoComponents = {
  Input: DemoInput,
  NumberInput: DemoInput,
  Select: DemoSelect,
  Checkbox: DemoCheckbox,
  Textarea: DemoTextarea,
}

export { DemoArrayItems, DemoCheckbox, DemoInput, DemoSelect, DemoTextarea }
