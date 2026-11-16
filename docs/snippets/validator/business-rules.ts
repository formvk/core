import { createForm, onFieldValueChange } from '@formvk/core'
import { createFragment } from '@formvk/schema'

const f = createFragment()
const PLAN_SEATS = { free: 3, pro: 20, enterprise: 100 } as const

// #region cross-field
f.Field({
  component: 'Input',
  title: 'Seats',
  validator: [
    {
      validator: (value, _rule, { form }) => {
        const plan = form.values.plan as keyof typeof PLAN_SEATS
        return (
          typeof value !== 'number' || value <= PLAN_SEATS[plan] || `The ${plan} plan allows ${PLAN_SEATS[plan]} seats`
        )
      },
    },
  ],
})
// #endregion

// #region array-rule
f.Array(f.Field({ component: 'Input' }), {
  title: 'Members',
  validator: [
    {
      validator: (value, _rule, { form }) => {
        const plan = form.values.plan as keyof typeof PLAN_SEATS
        const limit = PLAN_SEATS[plan]
        return !Array.isArray(value) || value.length <= limit || `Up to ${limit} members on this plan`
      },
    },
  ],
})
// #endregion

// #region duplicate
f.Array(
  f.Field({
    component: 'Input',
    title: 'Email',
    validator: [
      {
        validator: (value, _rule, { form }) => {
          const matches = (form.values.members ?? []).filter((member: { email?: string }) => member.email === value)
          return matches.length <= 1 || 'This email is used by another member'
        },
      },
    ],
  })
)
// #endregion

// #region revalidate
// A cross-field rule only runs when its own field is validated. Pair the rule
// with an effect so the limit is re-checked as soon as the plan changes.
const form = createForm({
  values: { plan: 'free', seats: 3, members: [] },
  effects() {
    onFieldValueChange('plan', (_field, form) => {
      form.validate('seats')
      form.validate('members')
    })
  },
})
// #endregion

// #region async
const TAKEN_EMAILS = new Set(['taken@acme.com'])

f.Field({
  component: 'Input',
  title: 'Email',
  validator: [
    {
      // Expensive checks run when the user leaves the field, not on every keystroke.
      triggerType: 'onBlur',
      validator: async value => {
        await new Promise(resolve => setTimeout(resolve, 150))
        return !TAKEN_EMAILS.has(String(value)) || 'This email has already been invited'
      },
    },
  ],
})
// #endregion

void form
