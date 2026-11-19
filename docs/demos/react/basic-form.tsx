import { createForm, createSchema, createSchemaOptions, FormProvider, SchemaField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

import { DemoArrayItems, demoComponents, FormItem } from './components'

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})

const schema = createSchema({
  username: f.Input({
    title: 'Username',
    required: true,
    validator: [
      { required: true, message: 'Username is required' },
      { minLength: 3, message: 'Use at least 3 characters' },
    ],
    componentProps: { placeholder: 'alice' },
  }),
  role: f.Select({
    title: 'Role',
    required: true,
    validator: [{ required: true, message: 'Please select a role' }],
    componentProps: {
      placeholder: 'Select a role',
      options: [
        { label: 'Developer', value: 'developer' },
        { label: 'Designer', value: 'designer' },
        { label: 'Product Manager', value: 'pm' },
      ],
    },
  }),
  subscribe: f.Checkbox({
    title: 'Subscribe to product updates',
  }),
  bio: f.Textarea({
    title: 'Bio',
    componentProps: { placeholder: 'Tell us something about yourself', rows: 3 },
  }),
})

export default observer(function BasicFormDemo() {
  // The form is created lazily inside the component: each instance owns an
  // independent form, and FormProvider cleans it up on unmount
  const [form] = useState(() =>
    createForm({
      values: {
        username: '',
        role: '',
        subscribe: false,
        bio: '',
      },
    })
  )
  const [submitted, setSubmitted] = useState('')

  async function onSubmit() {
    try {
      const values = await form.submit()
      setSubmitted(JSON.stringify(values, null, 2))
    } catch {
      setSubmitted('Please fix the highlighted fields.')
    }
  }

  function onReset() {
    form.reset()
    setSubmitted('')
  }

  return (
    <OptionsProvider>
      <FormProvider form={form}>
        <div className="dr-demo">
          <SchemaField schema={schema} />
          <div className="dr-actions">
            <button type="button" className="dr-btn" disabled={form.submitting} onClick={onSubmit}>
              {form.submitting ? 'Submitting…' : 'Submit'}
            </button>
            <button type="button" className="dr-btn dr-btn--ghost" onClick={onReset}>
              Reset
            </button>
          </div>
          {submitted ? (
            <div className="dr-result">
              <pre>{submitted}</pre>
            </div>
          ) : null}
        </div>
      </FormProvider>
    </OptionsProvider>
  )
})
