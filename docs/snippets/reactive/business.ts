import { createForm } from '@formvk/core'
import { autorun, batch, computed, toJS } from '@formvk/reactive'

const form = createForm({
  values: {
    plan: 'free',
    members: [{ email: 'ada@acme.com' }, { email: '' }],
  },
})

// #region derived
// A derivation over form values: recomputes only when a value it read changes.
const readyInvites = computed(() => form.values.members.filter((member: any) => member.email).length)

console.log(readyInvites.value) // 1
// #endregion

// #region autosave
// Runs once immediately and again after every change to the values it reads.
const stop = autorun(() => {
  localStorage.setItem('team-draft', JSON.stringify(toJS(form.values)))
})

// Call it when the form unmounts; the autorun stops re-running.
stop()
// #endregion

// #region batch
// Several writes, one flush: dependent effects run once.
batch(() => {
  form.setValuesIn('plan', 'pro')
  form.setValuesIn('members.0.email', 'grace@acme.com')
  form.setValuesIn('members.1.email', 'linus@acme.com')
})
// #endregion
