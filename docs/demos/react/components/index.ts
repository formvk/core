import './demo.css'
import { ArrayItems } from './ArrayItems'
import { Checkbox } from './Checkbox'
import { FormItem } from './FormItem'
import { Input } from './Input'
import { PerfRows } from './PerfRows'
import { Select } from './Select'
import { Textarea } from './Textarea'

/**
 * Flat name → component map: passed to createSchemaOptions for fragment type
 * inference. Unclassified components default to field components; ArrayItems
 * and FormItem are array / void (decorator) components, classified separately
 * via the factory's arrayComponents / voidComponents maps and merged into the
 * runtime map automatically.
 */
export const components = {
  Input,
  NumberInput: Input,
  Select,
  Checkbox,
  Textarea,
}

export { ArrayItems, Checkbox, Input, PerfRows, Select, Textarea, FormItem }
