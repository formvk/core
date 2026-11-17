import { createFragment } from '@formvk/schema'

// #region maps
interface FieldComponents {
  Input: (props: { placeholder?: string }) => any
}
interface VoidComponents {
  Card: (props: { title?: string }) => any
}
interface ArrayComponents {
  ArrayItems: (props: { maxItems?: number }) => any
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
