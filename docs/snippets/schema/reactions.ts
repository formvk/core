import { createFragment } from '@formvk/schema'

const f = createFragment()

// #region field-reaction
const email = f.Field({
  title: 'Email',
  component: 'Input',
  reactions: field => {
    const subscribe = field.form.values.subscribe === true
    field.visible = subscribe
    field.required = subscribe
  },
})
// #endregion

// #region reaction-object
// The object form keeps the whole reaction inside the schema definition.
// Prefer the function form above unless the reaction must stay plain JSON.
const reaction = {
  dependencies: ['subscribe'],
  when: '{{ $values.subscribe === true }}',
  fulfill: { state: { visible: true, required: true } },
  otherwise: { state: { visible: false, required: false } },
}
// #endregion

void email
void reaction
