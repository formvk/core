import { createFragment } from '@formvk/schema'

// Framework-agnostic component types: props are the first parameter of the function.
interface MyFieldComponents {
  Input: (props: { placeholder?: string; maxLength?: number }) => any
  NumberPicker: (props: { min?: number; max?: number }) => any
}
interface MyVoidComponents {
  Card: (props: { title?: string }) => any
}
interface MyArrayComponents {
  ArrayTable: (props: { columns?: string[] }) => any
}

// #region creators
const f = createFragment<MyFieldComponents, MyVoidComponents, MyArrayComponents>()

f.Field({ component: 'Input', componentProps: { placeholder: 'Name' } })
f.Input({ componentProps: { maxLength: 10 } })
f.Void({}, { component: 'Card' })
f.Array(f.Field(), { component: 'ArrayTable' })
// #endregion

// #region runtime-names
const f2 = createFragment<MyFieldComponents, MyVoidComponents, MyArrayComponents>({
  voidComponentNames: ['Card'],
  arrayComponentNames: ['ArrayTable'],
})

f2.Card({})
// #endregion
