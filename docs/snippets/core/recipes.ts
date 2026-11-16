import { createForm } from '@formvk/core'

interface TeamDraft {
  teamName: string
  plan: string
  members: Array<{ email?: string }>
}

const form = createForm<TeamDraft>({
  values: {
    teamName: '',
    plan: 'free',
    members: [{ email: '' }],
  },
})

// #region step-validation
async function validateInvites() {
  // Only the email fields of the member group; everything else stays untouched.
  await form.validate('members.*.email')
}
// #endregion

// #region review
async function submitForReview() {
  await form.submit()
  // After a successful submit, render the same schema as static text.
  form.setPattern('readPretty')
}
// #endregion

// #region first-error
async function focusFirstError() {
  try {
    await form.submit()
  } catch {
    const first = form.errors[0]
    const address = first?.address ?? first?.path
    if (address) {
      form
        .query(address)
        .take()
        ?.setState(state => {
          state.active = true
        })
    }
  }
}
// #endregion

// #region draft
function restoreDraft() {
  const draft = JSON.parse(localStorage.getItem('team-draft') ?? '{}')
  // Merge instead of replace: unknown keys in the draft are ignored by the schema.
  form.setValues(draft, 'deepMerge')
}

function saveDraft() {
  localStorage.setItem('team-draft', JSON.stringify(form.values))
}
// #endregion

// #region bulk
function requireAllEmails() {
  form.setFieldState('members.*.email', field => {
    field.required = true
  })
}

function replaceMembers() {
  form.setValuesIn('members', [{ email: 'ada@acme.com' }, { email: 'grace@acme.com' }])
}
// #endregion

void validateInvites
void submitForReview
void focusFirstError
void restoreDraft
void saveDraft
void requireAllEmails
void replaceMembers
