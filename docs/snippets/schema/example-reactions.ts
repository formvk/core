import { createExpression, createFragment } from '@formvk/schema'

interface FieldComponents {
  Input: Record<string, unknown>
}

const f = createFragment<FieldComponents>()
const exp = createExpression<{ plan: string; subscribe: boolean }>('$values')

const email = f.Input({
  title: 'Email',
  validator: [{ required: true, message: 'Email is required' }],
  reactions: [
    {
      dependencies: ['subscribe'],
      when: exp.subscribe.eq(true),
      fulfill: { state: { visible: true, required: true } },
      otherwise: { state: { visible: false, required: false } },
    },
  ],
})

void email
