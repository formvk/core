import { createFragment } from '@formvk/schema'

// #region maps
interface FieldComponents {
  Input: { placeholder?: string }
}
interface VoidComponents {
  Card: { title?: string }
}
interface ArrayComponents {
  ArrayItems: { maxItems?: number }
}
// #endregion

// #region creators
const f = createFragment<FieldComponents, VoidComponents, ArrayComponents>({
  arrayComponentNames: ['ArrayItems'],
})

f.Input({ componentProps: { placeholder: 'Name' } })
// equivalent to f.Field({ component: 'Input', componentProps: { placeholder: 'Name' } })

f.ArrayItems(f.Field())
// type: 'array' with component: 'ArrayItems'
// #endregion
