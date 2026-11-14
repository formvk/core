import { useForm } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

export const ValuesPreview = observer(() => {
  const form = useForm()
  return <pre>{JSON.stringify(form?.values)}</pre>
})
