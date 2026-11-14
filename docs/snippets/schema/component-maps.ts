import { createFragment } from '@formvk/schema'

interface MyFieldComponents {
  Input: { placeholder?: string; maxLength?: number }
  NumberPicker: { min?: number; max?: number }
}
interface MyVoidComponents {
  Card: { title?: string }
}
interface MyArrayComponents {
  ArrayTable: { columns?: string[] }
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
