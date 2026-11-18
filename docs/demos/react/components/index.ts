import './demo.css'
import { DemoArrayItems } from './DemoArrayItems'
import { DemoCheckbox } from './DemoCheckbox'
import { DemoInput } from './DemoInput'
import { DemoPerfRows } from './DemoPerfRows'
import { DemoSelect } from './DemoSelect'
import { DemoTextarea } from './DemoTextarea'
import { FormItem } from './FormItem'

/**
 * Flat name → component map: passed to createSchemaField for fragment type
 * inference. Unclassified components default to field components; ArrayItems
 * and FormItem are array / void (decorator) components, classified separately
 * via the factory's arrayComponents / voidComponents maps and merged into the
 * runtime map automatically.
 */
export const demoComponents = {
  Input: DemoInput,
  NumberInput: DemoInput,
  Select: DemoSelect,
  Checkbox: DemoCheckbox,
  Textarea: DemoTextarea,
}

export { DemoArrayItems, DemoCheckbox, DemoInput, DemoPerfRows, DemoSelect, DemoTextarea, FormItem }
