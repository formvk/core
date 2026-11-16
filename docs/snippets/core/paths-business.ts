import { createForm, isDataField } from '@formvk/core'

interface TeamForm {
  plan: string
  members: Array<{ email?: string; role?: string }>
}

const form = createForm<TeamForm>({
  values: {
    plan: 'pro',
    members: [
      { email: 'ada@acme.com', role: 'owner' },
      { email: '', role: 'member' },
    ],
  },
})

// #region address-vs-path
// `members.*.email` addresses fields: every matching row is updated in one call.
form.setFieldState('members.*.email', field => {
  field.required = true
})

// Values use the same pattern, without holding field references.
const firstEmail = form.getValuesIn('members.0.email')
// #endregion

// #region bulk
// Validate just the email column before rendering a step summary.
function validateEmails() {
  return form.validate('members.*.email')
}

// One write, every existing and future row.
function assignRoleToAll(role: string) {
  form.setFieldState('members.*.role', field => {
    field.value = role
  })
}
// #endregion

// #region group-read
// Read a whole column as plain values instead of field models.
const emails = form.query('members.*.email').map(field => (isDataField(field) ? (field.value as string) : ''))
const missing = emails.filter(email => !email)
// #endregion

// #region group-reset
// Reset only the member rows; plan and other fields keep their state.
function resetMembers() {
  form.reset('members.*')
}
// #endregion

void firstEmail
void validateEmails
void assignRoleToAll
void missing
void resetMembers
