import { expect, test, vi } from 'vitest'

import {
  createEffectContext,
  createForm,
  isVoidField,
  onFieldChange,
  onFieldInit,
  onFieldInitialValueChange,
  onFieldInputValueChange,
  onFieldLoading,
  onFieldMount,
  onFieldReact,
  onFieldReset,
  onFieldSubmit,
  onFieldSubmitEnd,
  onFieldSubmitFailed,
  onFieldSubmitStart,
  onFieldSubmitSuccess,
  onFieldSubmitValidateEnd,
  onFieldSubmitValidateFailed,
  onFieldSubmitValidateStart,
  onFieldSubmitValidateSuccess,
  onFieldUnmount,
  onFieldValidateEnd,
  onFieldValidateFailed,
  onFieldValidateStart,
  onFieldValidateSuccess,
  onFieldValueChange,
  onFieldValidating,
  onFormInit,
  onFormInitialValuesChange,
  onFormInputChange,
  onFormLoading,
  onFormMount,
  onFormReact,
  onFormReset,
  onFormSubmit,
  onFormSubmitEnd,
  onFormSubmitFailed,
  onFormSubmitStart,
  onFormSubmitSuccess,
  onFormSubmitValidateEnd,
  onFormSubmitValidateFailed,
  onFormSubmitValidateStart,
  onFormSubmitValidateSuccess,
  onFormUnmount,
  onFormValidateEnd,
  onFormValidateFailed,
  onFormValidateStart,
  onFormValidateSuccess,
  onFormValuesChange,
} from '..'
import { runEffects } from '../shared/effective'
import { attach, sleep } from './shared'

test('onFormInit/onFormMount/onFormUnmount', () => {
  const init = vi.fn()
  const mount = vi.fn()
  const unmount = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFormInit(init)
        onFormMount(mount)
        onFormUnmount(unmount)
      },
    })
  )
  expect(init).toHaveBeenCalledTimes(1)
  expect(mount).toHaveBeenCalledTimes(1)
  expect(unmount).not.toHaveBeenCalled()
  form.onUnmount()
  expect(unmount).toHaveBeenCalledTimes(1)
})

test('onFormValuesChange/onFormInitialValuesChange', () => {
  const valuesChange = vi.fn()
  const initialValuesChange = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFormValuesChange(valuesChange)
        onFormInitialValuesChange(initialValuesChange)
      },
    })
  )
  expect(valuesChange).not.toHaveBeenCalled()
  expect(initialValuesChange).not.toHaveBeenCalled()

  form.setValues({ aa: '123' })
  expect(form.values.aa).toEqual('123')
  expect(valuesChange).toHaveBeenCalled()

  form.setInitialValues({ aa: '321', bb: '123' })
  expect(form.values.aa).toEqual('321')
  expect(form.values.bb).toEqual('123')
  expect(initialValuesChange).toHaveBeenCalled()
})

test('onFormLoading', async () => {
  const loading = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFormLoading(loading)
      },
    })
  )
  form.setLoading(true)
  await sleep(150)
  expect(loading).toHaveBeenCalledTimes(1)
  form.setLoading(false)
})

test('onFormInputChange', () => {
  const inputChange = vi.fn()
  const valuesChange = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFormValuesChange(valuesChange)
        onFormInputChange(inputChange)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa' })!)

  expect(inputChange).not.toHaveBeenCalled()
  expect(valuesChange).not.toHaveBeenCalled()

  field.setValue('123')
  expect(inputChange).not.toHaveBeenCalled()
  expect(valuesChange).toHaveBeenCalledTimes(1)

  field.onInput('123')
  expect(inputChange).toHaveBeenCalled()
  expect(valuesChange).toHaveBeenCalledTimes(1)

  field.onInput('321')
  expect(inputChange).toHaveBeenCalledTimes(2)
  expect(valuesChange).toHaveBeenCalledTimes(2)
})

test('onFormReact', () => {
  const react = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFormReact(form => {
          if (form.values.aa) react()
        })
      },
    })
  )
  expect(react).not.toHaveBeenCalled()
  form.setValues({ aa: 123 })
  expect(react).toHaveBeenCalledTimes(1)
  form.onUnmount()

  // 不传 callback 也不会抛错
  const form2 = attach(
    createForm({
      effects() {
        onFormReact()
      },
    })
  )
  form2.onUnmount()
})

test('onFormReset', async () => {
  const reset = vi.fn()
  const form = attach(
    createForm({
      initialValues: { aa: 123 },
      effects() {
        onFormReset(reset)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa' })!)
  field.setValue('xxxx')
  expect(field.value).toEqual('xxxx')
  expect(reset).not.toHaveBeenCalled()

  await form.reset()
  expect(field.value).toEqual(123)
  expect(form.values.aa).toEqual(123)
  expect(reset).toHaveBeenCalledTimes(1)
})

test('onFormSubmit', async () => {
  const submit = vi.fn()
  const submitStart = vi.fn()
  const submitEnd = vi.fn()
  const submitSuccess = vi.fn()
  const submitFailed = vi.fn()
  const submitValidateStart = vi.fn()
  const submitValidateFailed = vi.fn()
  const submitValidateSuccess = vi.fn()
  const submitValidateEnd = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFormSubmitStart(submitStart)
        onFormSubmit(submit)
        onFormSubmitEnd(submitEnd)
        onFormSubmitFailed(submitFailed)
        onFormSubmitSuccess(submitSuccess)
        onFormSubmitValidateStart(submitValidateStart)
        onFormSubmitValidateFailed(submitValidateFailed)
        onFormSubmitValidateSuccess(submitValidateSuccess)
        onFormSubmitValidateEnd(submitValidateEnd)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa', required: true })!)

  try {
    await form.submit()
  } catch {}
  expect(submitStart).toHaveBeenCalledTimes(1)
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submitEnd).toHaveBeenCalledTimes(1)
  expect(submitSuccess).not.toHaveBeenCalled()
  expect(submitFailed).toHaveBeenCalledTimes(1)
  expect(submitValidateStart).toHaveBeenCalledTimes(1)
  expect(submitValidateFailed).toHaveBeenCalledTimes(1)
  expect(submitValidateSuccess).not.toHaveBeenCalled()
  expect(submitValidateEnd).toHaveBeenCalledTimes(1)

  field.onInput('123')
  try {
    await form.submit()
  } catch {}
  expect(submitStart).toHaveBeenCalledTimes(2)
  expect(submit).toHaveBeenCalledTimes(2)
  expect(submitEnd).toHaveBeenCalledTimes(2)
  expect(submitSuccess).toHaveBeenCalledTimes(1)
  expect(submitFailed).toHaveBeenCalledTimes(1)
  expect(submitValidateStart).toHaveBeenCalledTimes(2)
  expect(submitValidateFailed).toHaveBeenCalledTimes(1)
  expect(submitValidateSuccess).toHaveBeenCalledTimes(1)
  expect(submitValidateEnd).toHaveBeenCalledTimes(2)
})

test('onFormValidate', async () => {
  const validateStart = vi.fn()
  const validateEnd = vi.fn()
  const validateFailed = vi.fn()
  const validateSuccess = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFormValidateStart(validateStart)
        onFormValidateEnd(validateEnd)
        onFormValidateFailed(validateFailed)
        onFormValidateSuccess(validateSuccess)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa', required: true })!)

  try {
    await form.validate()
  } catch {}
  expect(validateStart).toHaveBeenCalledTimes(1)
  expect(validateEnd).toHaveBeenCalledTimes(1)
  expect(validateFailed).toHaveBeenCalledTimes(1)
  expect(validateSuccess).not.toHaveBeenCalled()

  field.onInput('123')
  try {
    await form.validate()
  } catch {}
  expect(validateStart).toHaveBeenCalledTimes(2)
  expect(validateEnd).toHaveBeenCalledTimes(2)
  expect(validateFailed).toHaveBeenCalledTimes(1)
  expect(validateSuccess).toHaveBeenCalledTimes(1)
})

test('onFieldInit/onFieldMount/onFieldUnmount', () => {
  const fieldInit = vi.fn()
  const fieldMount = vi.fn()
  const fieldUnmount = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFieldInit('aa', fieldInit)
        onFieldMount('aa', fieldMount)
        onFieldUnmount('aa', fieldUnmount)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa' })!)
  expect(fieldInit).toHaveBeenCalledTimes(1)
  expect(fieldMount).toHaveBeenCalledTimes(1)
  expect(fieldUnmount).not.toHaveBeenCalled()

  field.onUnmount()
  expect(fieldUnmount).toHaveBeenCalledTimes(1)
})

test('onFieldInit 已存在字段时立即回调', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa' })!)
  const init = vi.fn()
  form.setEffects(() => {
    onFieldInit('aa', init)
  })
  expect(init).toHaveBeenCalledWith(field, form)
})

test('onFieldChange', async () => {
  const fieldChange = vi.fn()
  const valueChange = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFieldChange(
          'aa',
          ['value', 'disabled', 'initialized', 'inputValue', 'loading', 'visible', 'editable'],
          fieldChange
        )
        onFieldChange('aa', valueChange)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa' })!)

  expect(fieldChange).toHaveBeenCalledTimes(1)
  field.setValue('123')
  expect(fieldChange).toHaveBeenCalledTimes(2)
  field.onInput('321')
  expect(fieldChange).toHaveBeenCalledTimes(3)
  field.setLoading(true)
  await sleep(150)
  expect(fieldChange).toHaveBeenCalledTimes(4)
  field.setPattern('disabled')
  expect(fieldChange).toHaveBeenCalledTimes(5)
  field.setDisplay('none')
  expect(fieldChange).toHaveBeenCalledTimes(6)
  form.onUnmount()

  expect(valueChange).toHaveBeenCalledTimes(4)
})

test('onFieldInitialValueChange/onFieldValueChange/onFieldInputValueChange', () => {
  const fieldValueChange = vi.fn()
  const fieldInitialValueChange = vi.fn()
  const fieldInputValueChange = vi.fn()
  const notTrigger = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFieldInitialValueChange('aa', fieldInitialValueChange)
        onFieldValueChange('aa', fieldValueChange)
        onFieldInputValueChange('aa', fieldInputValueChange)
        onFieldValueChange('xx', notTrigger)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa' })!)

  field.setValue('123')
  expect(fieldValueChange).toHaveBeenCalledTimes(1)
  expect(fieldInitialValueChange).not.toHaveBeenCalled()
  expect(fieldInputValueChange).not.toHaveBeenCalled()

  field.setInitialValue('xxx')
  expect(fieldValueChange).toHaveBeenCalledTimes(2)
  expect(fieldInitialValueChange).toHaveBeenCalledTimes(1)
  expect(fieldInputValueChange).not.toHaveBeenCalled()

  field.onInput('321')
  expect(fieldValueChange).toHaveBeenCalledTimes(3)
  expect(fieldInitialValueChange).toHaveBeenCalledTimes(1)
  expect(fieldInputValueChange).toHaveBeenCalledTimes(1)
  expect(notTrigger).not.toHaveBeenCalled()
})

test('onFieldReact', () => {
  const react = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFieldReact('aa', field => {
          if (isVoidField(field)) return
          if (field.value) react('value')
          if (field.display === 'hidden') react('display')
        })
        onFieldReact('aa', null!)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa' })!)
  expect(react).not.toHaveBeenCalled()

  form.setValues({ aa: 123 })
  expect(react).toHaveBeenCalledWith('value')

  field.setDisplay('hidden')
  expect(react).toHaveBeenCalledWith('display')
  form.onUnmount()
})

test('onFieldLoading', async () => {
  const loading = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFieldLoading('aa', loading)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa' })!)
  field.setLoading(true)
  await sleep(150)
  expect(loading).toHaveBeenCalledTimes(1)
  field.setLoading(false)
})

test('onFieldReset', async () => {
  const reset = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFieldReset('aa', reset)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa', initialValue: 123 })!)
  await field.reset()
  expect(reset).toHaveBeenCalledTimes(1)
  expect(field.value).toEqual(123)
})

test('onFieldValidate', async () => {
  const validateStart = vi.fn()
  const validateFailed = vi.fn()
  const validateSuccess = vi.fn()
  const validateEnd = vi.fn()
  const validating = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFieldValidateStart('aa', validateStart)
        onFieldValidateEnd('aa', validateEnd)
        onFieldValidateFailed('aa', validateFailed)
        onFieldValidateSuccess('aa', validateSuccess)
        onFieldValidating('aa', validating)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa', required: true })!)

  try {
    await field.validate()
  } catch {}
  expect(validateStart).toHaveBeenCalledTimes(1)
  expect(validateFailed).toHaveBeenCalledTimes(1)
  expect(validateSuccess).not.toHaveBeenCalled()
  expect(validateEnd).toHaveBeenCalledTimes(1)

  field.setValue('123')
  try {
    await field.validate()
  } catch {}
  expect(validateStart).toHaveBeenCalledTimes(2)
  expect(validateFailed).toHaveBeenCalledTimes(1)
  expect(validateSuccess).toHaveBeenCalledTimes(1)
  expect(validateEnd).toHaveBeenCalledTimes(2)
})

test('onFieldSubmit', async () => {
  const submit = vi.fn()
  const submitStart = vi.fn()
  const submitEnd = vi.fn()
  const submitSuccess = vi.fn()
  const submitFailed = vi.fn()
  const submitValidateStart = vi.fn()
  const submitValidateFailed = vi.fn()
  const submitValidateSuccess = vi.fn()
  const submitValidateEnd = vi.fn()
  const form = attach(
    createForm({
      effects() {
        onFieldSubmitStart('aa', submitStart)
        onFieldSubmit('aa', submit)
        onFieldSubmitEnd('aa', submitEnd)
        onFieldSubmitSuccess('aa', submitSuccess)
        onFieldSubmitFailed('aa', submitFailed)
        onFieldSubmitValidateStart('aa', submitValidateStart)
        onFieldSubmitValidateFailed('aa', submitValidateFailed)
        onFieldSubmitValidateSuccess('aa', submitValidateSuccess)
        onFieldSubmitValidateEnd('aa', submitValidateEnd)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa', required: true })!)
  try {
    await field.submit()
  } catch {}
  expect(submitStart).toHaveBeenCalledTimes(1)
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submitEnd).toHaveBeenCalledTimes(1)
  expect(submitSuccess).not.toHaveBeenCalled()
  expect(submitFailed).toHaveBeenCalledTimes(1)
  expect(submitValidateStart).toHaveBeenCalledTimes(1)
  expect(submitValidateFailed).toHaveBeenCalledTimes(1)
  expect(submitValidateSuccess).not.toHaveBeenCalled()
  expect(submitValidateEnd).toHaveBeenCalledTimes(1)

  field.setValue('123')
  const result = await field.submit(async value => ({ value }))
  expect(result).toEqual({ value: '123' })
  expect(submitSuccess).toHaveBeenCalledTimes(1)
})

test('异步调用 effect hook 会抛错', async () => {
  const valueChange = vi.fn()
  let error: unknown
  const form = attach(
    createForm({
      effects() {
        setTimeout(() => {
          try {
            onFieldValueChange('aa', valueChange)
          } catch (e) {
            error = e
          }
        }, 0)
      },
    })
  )
  const field = attach(form.createField({ name: 'aa' })!)
  await sleep(10)
  field.setValue('123')
  expect(valueChange).not.toHaveBeenCalled()
  expect(error).not.toBeUndefined()
})

test('effect context', async () => {
  const context = createEffectContext<number>()
  const context2 = createEffectContext<number>()
  const context3 = createEffectContext<number>(123)
  let results: any
  let error: any
  let error2: any
  function consumer() {
    results = context.consume()
  }
  function consumer2() {
    setTimeout(() => {
      try {
        results = context2.consume()
      } catch (e) {
        error2 = e
      }
    }, 0)
  }
  const context3Results = { value: undefined as number | undefined }
  attach(
    createForm({
      effects() {
        context.provide(123)
        context3.provide()
        context3Results.value = context3.consume()
        consumer()
        setTimeout(() => {
          try {
            context2.provide(123)
          } catch (e) {
            error = e
          }
        }, 0)
        consumer2()
      },
    })
  )
  await sleep(10)
  expect(results).toEqual(123)
  expect(context3Results.value).toEqual(123)
  expect(error).not.toBeUndefined()
  expect(error2).not.toBeUndefined()
})

test('runEffects', () => {
  expect(
    runEffects(123, () => {
      onFormMount(() => {})
    }).length
  ).toEqual(1)
})
