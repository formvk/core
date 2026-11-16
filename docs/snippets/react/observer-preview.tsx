import { observer, useForm } from '@formvk/react'

export const ValuesPreview = observer(() => {
  const form = useForm()
  return <pre>{JSON.stringify(form?.values)}</pre>
})
