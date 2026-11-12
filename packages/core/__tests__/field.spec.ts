import { expect, test } from 'vitest'

import { createForm, setValidateLanguage } from '../src'
import { attach } from './shared'

setValidateLanguage('en')

test('创建字段并读取配置', () => {
  const form = attach(createForm())
  const field1 = attach(
    form.createField({
      name: 'field1',
      title: '字段一',
      description: '字段一描述',
      required: true,
    })!
  )
  expect(field1.title).toEqual('字段一')
  expect(field1.description).toEqual('字段一描述')
  expect(field1.required).toBeTruthy()
  expect(field1.validator).toEqual([{ required: true }])

  const field2 = attach(form.createField({ name: 'field2', disabled: true, hidden: true })!)
  expect(field2.pattern).toEqual('disabled')
  expect(field2.disabled).toBeTruthy()
  expect(field2.display).toEqual('hidden')
  expect(field2.hidden).toBeTruthy()

  const field3 = attach(form.createField({ name: 'field3', readOnly: true, visible: false })!)
  expect(field3.pattern).toEqual('readOnly')
  expect(field3.readOnly).toBeTruthy()
  expect(field3.display).toEqual('none')
  expect(field3.visible).toBeFalsy()

  const field4 = attach(form.createField({ name: 'field4', value: 123 })!)
  expect(field4.value).toEqual(123)
  expect(field4.initialValue).toBeUndefined()

  const field5 = attach(form.createField({ name: 'field5', initialValue: 123 })!)
  expect(field5.value).toEqual(123)
  expect(field5.initialValue).toEqual(123)
})

test('字段值与表单值保持同步', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa' })!)

  field.value = '123'
  expect(form.values.aa).toEqual('123')
  expect(form.getValuesIn('aa')).toEqual('123')

  form.setValuesIn('aa', '321')
  expect(field.value).toEqual('321')

  field.setInitialValue('init')
  expect(field.initialValue).toEqual('init')
  expect(form.initialValues.aa).toEqual('init')
})

test('输入字段会更新值与修改状态', async () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa' })!)

  await field.onInput('123')
  expect(field.value).toEqual('123')
  expect(field.inputValue).toEqual('123')
  expect(field.inputValues).toEqual(['123'])
  expect(field.selfModified).toBeTruthy()
  expect(field.modified).toBeTruthy()
  expect(form.modified).toBeTruthy()
})

test('必填字段校验', async () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa', required: true })!)

  await expect(field.validate()).rejects.toBeTruthy()
  expect(field.selfErrors).toEqual(['The field value is required'])
  expect(field.valid).toBeFalsy()
  expect(field.invalid).toBeTruthy()
  expect(field.validateStatus).toEqual('error')

  await field.onInput('123')
  expect(field.value).toEqual('123')
  expect(field.selfErrors).toEqual([])
  expect(field.valid).toBeTruthy()
  expect(field.validateStatus).toBeUndefined()
})

test('自定义校验器与反馈', async () => {
  const form = attach(createForm())
  const field = attach(
    form.createField({
      name: 'aa',
      validator(value: string) {
        if (!value) return '不能为空'
        if (value.length < 3) {
          return {
            type: 'warning',
            message: '内容太短',
          }
        }
      },
    })!
  )

  try {
    await field.validate()
  } catch {}
  expect(field.selfErrors).toEqual(['不能为空'])

  await field.onInput('ab')
  expect(field.selfWarnings).toEqual(['内容太短'])

  await field.onInput('abc')
  expect(field.selfErrors).toEqual([])
  expect(field.selfWarnings).toEqual([])
})

test('设置校验规则', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa', required: true })!)

  field.setValidatorRule('format', 'phone')
  expect(field.validator).toEqual([{ required: true }, { format: 'phone' }])

  field.setValidatorRule('required', false)
  expect(field.validator).toEqual([{ required: false }, { format: 'phone' }])
  expect(field.required).toBeFalsy()
})

test('字段显示状态切换时缓存值', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa', value: '123' })!)

  expect(field.value).toEqual('123')

  field.setDisplay('none')
  expect(field.display).toEqual('none')
  expect(field.value).toBeUndefined()
  expect(form.existValuesIn('aa')).toBeFalsy()

  field.setDisplay('visible')
  expect(field.display).toEqual('visible')
  expect(field.value).toEqual('123')
})

test('切换字段交互模式', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa', value: '123' })!)

  field.setPattern('readOnly')
  expect(field.pattern).toEqual('readOnly')
  expect(field.readOnly).toBeTruthy()
  expect(field.editable).toBeFalsy()

  field.setPattern('disabled')
  expect(field.disabled).toBeTruthy()

  field.setPattern('readPretty')
  expect(field.readPretty).toBeTruthy()

  field.setPattern('editable')
  expect(field.editable).toBeTruthy()
})

test('字段挂载与卸载', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa' })!)

  expect(field.mounted).toBeTruthy()
  expect(field.initialized).toBeTruthy()

  field.onUnmount()
  expect(field.mounted).toBeFalsy()
  expect(field.unmounted).toBeTruthy()

  field.onMount()
  expect(field.mounted).toBeTruthy()
  expect(field.unmounted).toBeFalsy()
})

test('查询字段', () => {
  const form = attach(createForm())
  const object = attach(form.createObjectField({ name: 'object' })!)
  attach(form.createField({ name: 'a', basePath: 'object' }))
  attach(form.createField({ name: 'b', basePath: 'object' }))
  attach(form.createArrayField({ name: 'array', basePath: 'object' }))
  attach(form.createField({ name: '0', basePath: 'object.array' }))

  const paths = object.query('*').map(field => field.path.toString())
  expect(paths).toContain('object.a')
  expect(paths).toContain('object.b')
  expect(paths).toContain('object.array')
  expect(paths).toContain('object.array.0')

  expect(object.query('object.a').take()?.address.toString()).toEqual('object.a')
  expect(form.query('object.*').map(field => field.address.toString())).toContain('object.a')
})

test('销毁字段会清理值与初始值', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa', initialValue: 456 })!)

  expect(form.values.aa).toEqual(456)
  expect(form.initialValues.aa).toEqual(456)

  field.destroy()
  expect(form.fields.aa).toBeUndefined()
  expect(form.existValuesIn('aa')).toBeFalsy()
  expect(form.existInitialValuesIn('aa')).toBeFalsy()
})

test('字段同时声明值与初始值时初始值优先生效', () => {
  const form = attach(createForm())
  // 与 formily 行为一致：构造期先写入 initialValue，value 因默认值保护被跳过
  const field = attach(form.createField({ name: 'aa', value: 123, initialValue: 456 })!)
  expect(field.value).toEqual(456)
  expect(form.initialValues.aa).toEqual(456)

  // 构造完成后显式赋值不再受默认值保护限制
  field.setValue(789)
  expect(field.value).toEqual(789)
})

test('设置组件与装饰器', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa' })!)
  const Component = () => null
  const Decorator = () => null

  field.setComponent(Component, { a: 1 })
  expect(field.componentType).toBe(Component)
  expect(field.componentProps).toEqual({ a: 1 })

  field.setComponentProps({ b: 2 })
  expect(field.componentProps).toEqual({ a: 1, b: 2 })

  field.setDecorator(Decorator, { c: 3 })
  expect(field.decoratorType).toBe(Decorator)
  expect(field.decoratorProps).toEqual({ c: 3 })

  field.setDecoratorProps({ d: 4 })
  expect(field.decoratorProps).toEqual({ c: 3, d: 4 })
})

test('设置字段反馈信息', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa' })!)

  field.setFeedback({ type: 'error', messages: ['出错了'] })
  expect(field.selfErrors).toEqual(['出错了'])
  expect(field.queryFeedbacks({ address: 'aa' })).toHaveLength(1)
  expect(field.queryFeedbacks({ address: 'bb' })).toHaveLength(0)

  field.setFeedback({ type: 'warning', messages: ['警告'] })
  expect(field.selfWarnings).toEqual(['警告'])

  field.setFeedback({ type: 'success', messages: ['成功'] })
  expect(field.selfSuccesses).toEqual(['成功'])

  field.setFeedback({ type: 'error', messages: [] })
  expect(field.selfErrors).toEqual([])
})

test('设置与读取字段状态', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa' })!)

  field.setState({ title: '标题', description: '描述' })
  expect(field.title).toEqual('标题')
  expect(field.description).toEqual('描述')
  expect(field.getState(state => state.title)).toEqual('标题')

  field.setState(state => {
    state.value = '123'
  })
  expect(field.value).toEqual('123')

  const state = field.getState()
  expect(state.address).toEqual('aa')
  expect(state.path).toEqual('aa')
  expect(state.value).toEqual('123')
})

test('设置字段数据与内容', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa' })!)

  field.setTitle('新标题')
  field.setDescription('新描述')
  field.setData({ extra: 1 })
  field.setContent('内容')
  field.setDataSource([{ label: '选项一', value: 1 }])

  expect(field.title).toEqual('新标题')
  expect(field.description).toEqual('新描述')
  expect(field.data).toEqual({ extra: 1 })
  expect(field.content).toEqual('内容')
  expect(field.dataSource).toEqual([{ label: '选项一', value: 1 }])
})

test('按校验模式与显示状态控制字段校验', async () => {
  const form = attach(
    createForm({
      validatePattern: ['editable'],
      validateDisplay: ['visible'],
    })
  )
  const field1 = attach(form.createField({ name: 'a', required: true })!)
  const field2 = attach(
    form.createField({
      name: 'b',
      required: true,
      validatePattern: ['readOnly'],
      validateDisplay: ['hidden'],
    })!
  )
  const field3 = attach(
    form.createField({
      name: 'c',
      required: true,
      validatePattern: ['readOnly', 'editable'],
      validateDisplay: ['hidden', 'visible'],
    })!
  )

  try {
    await form.validate()
  } catch {}
  expect(field1.selfErrors).toHaveLength(1)
  expect(field2.selfErrors).toHaveLength(0)
  expect(field3.selfErrors).toHaveLength(1)

  form.setPattern('readOnly')
  form.setDisplay('hidden')
  try {
    await form.validate()
  } catch {}
  // 切到 readOnly + hidden 后：field1 被跳过且错误被 reaction 清空，field2/field3 命中各自配置
  expect(field1.selfErrors).toHaveLength(0)
  expect(field2.selfErrors).toHaveLength(1)
  expect(field3.selfErrors).toHaveLength(1)
})

test('字段级校验配置覆盖表单级配置', async () => {
  const form = attach(
    createForm({
      validatePattern: ['editable'],
      validateDisplay: ['visible'],
    })
  )
  // 表单默认只校验 editable + visible，该字段自行放宽到 readOnly
  const field = attach(
    form.createField({
      name: 'aa',
      required: true,
      validatePattern: ['editable', 'readOnly'],
    })!
  )

  form.setPattern('readOnly')
  try {
    await form.validate()
  } catch {}
  expect(field.selfErrors).toEqual(['The field value is required'])

  // 未配置放宽的字段仍被跳过
  const skipped = attach(form.createField({ name: 'bb', required: true })!)
  try {
    await form.validate()
  } catch {}
  expect(skipped.selfErrors).toEqual([])
})
