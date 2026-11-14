import { createExpression, createFragment } from '@formvk/schema'

const f = createFragment()
const exp = createExpression<{ subscribe: boolean }>('$values')

// #region field-reaction
const email = f.Field({
  title: 'Email',
  component: 'Input',
  reactions: [
    {
      dependencies: ['subscribe'],
      when: exp.subscribe.eq(true),
      fulfill: { state: { visible: true, required: true } },
      otherwise: { state: { visible: false, required: false } },
    },
  ],
})
// #endregion

// #region reaction-object
const reaction = {
  dependencies: ['subscribe'],
  when: exp.subscribe.eq(true),
  fulfill: { state: { visible: true, required: true } },
  otherwise: { state: { visible: false, required: false } },
}
// #endregion

void email
void reaction
