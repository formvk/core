import { createFragment, createSchema } from '@formvk/schema'

const f = createFragment()

// #region field-reaction
interface InviteValues {
  subscribe?: boolean
  email?: string
}

const schema = createSchema<InviteValues>({
  subscribe: f.Field({ component: 'Checkbox', title: 'Subscribe' }),
  email: f.Field({
    title: 'Email',
    component: 'Input',
    reactions: field => {
      // field.record is InviteValues: createSchema injected the declared values
      const subscribe = field.record.subscribe === true
      field.visible = subscribe
      field.required = subscribe
    },
  }),
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

void schema
void reaction
