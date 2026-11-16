import { useForm } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

// Rendered inside <FormProvider> but outside <SchemaField>:
// a footer toolbar that reads and drives the same form model.
export const SubmitBar = observer(() => {
  const form = useForm()

  if (!form) return null

  return (
    <div>
      <button type="button" disabled={form.submitting} onClick={() => form.submit()}>
        Create team
      </button>
      <button type="button" onClick={() => form.validate('members.*.email')}>
        Validate invites only
      </button>
    </div>
  )
})
