import { createFragment } from '@formvk/schema'

interface FieldComponents {
  Input: Record<string, never>
}
interface VoidComponents {
  FormItem: { label?: string }
}
type ArrayComponents = Record<string, never>

// #region basic
const f = createFragment<FieldComponents, VoidComponents, ArrayComponents>({
  defaultDecorator: 'FormItem',
})

f.Field({ title: 'Name', component: 'Input' })()
// { type: 'string', title: 'Name', component: 'Input', decorator: 'FormItem' }
// #endregion

// #region fifth-arg
const f2 = createFragment<FieldComponents, VoidComponents, ArrayComponents, {}, 'FormItem'>({
  defaultDecorator: 'FormItem',
})

f2.Field({ title: 'Name', decoratorProps: { label: 'Name' } }) // checked against FormItem's props
// #endregion
