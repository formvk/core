import { expect, test } from 'vitest'

import { createForm, LifeCycleTypes, onFormInitialValuesChange, onFormValuesChange, setValidateLanguage } from '../src'
import { attach, sleep } from './shared'

setValidateLanguage('en')

test('创建表单实例', () => {
  const form = attach(createForm())
  expect(form).not.toBeUndefined()
  expect(form.initialized).toBeTruthy()
  expect(form.mounted).toBeTruthy()
  expect(form.values).toEqual({})
  expect(form.initialValues).toEqual({})
})

test('创建各类字段', () => {
  const form = attach(createForm())
  const normal = attach(form.createField({ name: 'normal', basePath: 'parent' })!)
  const normal2 = form.createField({ name: 'normal', basePath: 'parent' })!
  const array = attach(form.createArrayField({ name: 'array', basePath: 'parent' })!)
  const array2 = form.createArrayField({ name: 'array', basePath: 'parent' })!
  const object = attach(form.createObjectField({ name: 'object', basePath: 'parent' })!)
  const object2 = form.createObjectField({ name: 'object', basePath: 'parent' })!
  const voidField = attach(form.createVoidField({ name: 'void', basePath: 'parent' })!)
  const voidField2 = form.createVoidField({ name: 'void', basePath: 'parent' })!
  const children = attach(form.createField({ name: 'children', basePath: 'parent.void' })!)

  expect(normal).toBe(normal2)
  expect(array).toBe(array2)
  expect(object).toBe(object2)
  expect(voidField).toBe(voidField2)
  expect(normal.address.toString()).toEqual('parent.normal')
  expect(normal.path.toString()).toEqual('parent.normal')
  expect(array.address.toString()).toEqual('parent.array')
  expect(array.value).toEqual([])
  expect(object.address.toString()).toEqual('parent.object')
  expect(object.value).toEqual({})
  expect(voidField.address.toString()).toEqual('parent.void')
  expect(children.address.toString()).toEqual('parent.void.children')
  expect(children.path.toString()).toEqual('parent.children')
  expect(form.createField({ name: '' })).toBeUndefined()
  expect(form.createArrayField({ name: '' })).toBeUndefined()
  expect(form.createObjectField({ name: '' })).toBeUndefined()
  expect(form.createVoidField({ name: '' })).toBeUndefined()
})

test('设置与读取表单值', () => {
  const form = attach(createForm())
  form.setValues({
    aa: 123,
    cc: {
      kk: 321,
    },
  })
  expect(form.values.aa).toEqual(123)
  expect(form.values.cc.kk).toEqual(321)

  form.setValues(
    {
      cc: {
        mm: 'ooo',
      },
    },
    'deepMerge'
  )
  expect(form.values.cc.kk).toEqual(321)
  expect(form.values.cc.mm).toEqual('ooo')

  form.setValues({ bb: '123' }, 'shallowMerge')
  expect(form.values.bb).toEqual('123')

  form.setValues({ aa: 456 }, 'overwrite')
  expect(form.values).toEqual({ aa: 456 })
})

test('按路径操作表单值', () => {
  const form = attach(createForm())
  form.setValues({ aa: 123, cc: { kk: 321 } })

  expect(form.getValuesIn('aa')).toEqual(123)
  expect(form.getValuesIn('cc.kk')).toEqual(321)
  expect(form.existValuesIn('cc.kk')).toBeTruthy()

  form.setValuesIn('cc.mm', 'ooo')
  expect(form.values.cc.mm).toEqual('ooo')
  expect(form.existValuesIn('cc.mm')).toBeTruthy()

  form.deleteValuesIn('cc.mm')
  expect(form.existValuesIn('cc.mm')).toBeFalsy()

  form.setInitialValuesIn('dd', 1)
  expect(form.initialValues.dd).toEqual(1)
  expect(form.getInitialValuesIn('dd')).toEqual(1)
  expect(form.existInitialValuesIn('dd')).toBeTruthy()

  form.deleteInitialValuesIn('dd')
  expect(form.existInitialValuesIn('dd')).toBeFalsy()
})

test('设置表单显示与交互模式', () => {
  const form = attach(createForm())
  expect(form.display).toEqual('visible')
  expect(form.pattern).toEqual('editable')

  form.setDisplay('hidden')
  expect(form.display).toEqual('hidden')
  expect(form.hidden).toBeTruthy()

  form.setDisplay('visible')
  expect(form.visible).toBeTruthy()

  form.setPattern('readOnly')
  expect(form.pattern).toEqual('readOnly')
  expect(form.readOnly).toBeTruthy()

  form.setPattern('disabled')
  expect(form.disabled).toBeTruthy()

  form.setPattern('readPretty')
  expect(form.readPretty).toBeTruthy()

  form.setPattern('editable')
  expect(form.editable).toBeTruthy()
})

test('校验表单并收集错误', async () => {
  const form = attach(createForm())
  const aa = attach(form.createField({ name: 'aa', required: true })!)
  const bb = attach(form.createField({ name: 'bb', required: true, value: '123' })!)
  const cc = attach(form.createField({ name: 'cc', required: true, pattern: 'readOnly' })!)

  await expect(form.validate()).rejects.toBeTruthy()

  expect(form.invalid).toBeTruthy()
  expect(aa.selfErrors).toEqual(['The field value is required'])
  expect(bb.selfErrors).toEqual([])
  expect(cc.selfErrors).toEqual([])
  expect(form.errors).toHaveLength(1)
  expect(form.errors[0]).toMatchObject({
    type: 'error',
    address: 'aa',
    path: 'aa',
    code: 'ValidateError',
    triggerType: 'onInput',
    messages: ['The field value is required'],
  })

  await aa.onInput('123')
  expect(aa.selfErrors).toEqual([])
  await form.validate()
  expect(form.valid).toBeTruthy()
})

test('提交表单', async () => {
  const form = attach(createForm({ values: { aa: '123' } }))
  const result = await form.submit(values => ({ ...values, submitted: true }))
  expect(result).toEqual({ aa: '123', submitted: true })
  expect(form.submitting).toBeFalsy()
})

test('提交时校验失败抛出错误', async () => {
  const form = attach(createForm())
  attach(form.createField({ name: 'aa', required: true }))
  await expect(form.submit()).rejects.toBeTruthy()
  expect(form.valid).toBeFalsy()
})

test('重置表单', async () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa', initialValue: 'init' })!)

  await field.onInput('changed')
  expect(field.value).toEqual('changed')
  expect(field.modified).toBeTruthy()
  expect(form.modified).toBeTruthy()

  await form.reset()
  expect(field.value).toEqual('init')
  expect(field.modified).toBeFalsy()
  expect(form.modified).toBeFalsy()
})

test('读取与设置表单及字段状态', () => {
  const form = attach(createForm({ values: { aa: 1 } }))
  expect(form.getState().values).toEqual({ aa: 1 })

  form.setState({ display: 'hidden', pattern: 'readOnly' })
  expect(form.display).toEqual('hidden')
  expect(form.pattern).toEqual('readOnly')

  form.setState(state => {
    state.display = 'visible'
  })
  expect(form.display).toEqual('visible')
  expect(form.getFormState(state => state.display)).toEqual('visible')

  form.setFormState({ pattern: 'editable' })
  expect(form.pattern).toEqual('editable')

  const field = attach(form.createField({ name: 'bb' })!)
  form.setFieldState('bb', { title: 'BB' })
  expect(field.title).toEqual('BB')
  expect(form.getFieldState('bb', state => state.title)).toEqual('BB')
})

test('订阅与取消订阅表单生命周期', async () => {
  const form = attach(createForm())
  const types: string[] = []
  const id = form.subscribe(({ type }) => {
    types.push(type)
  })

  form.onMount()
  form.setLoading(true)
  await sleep(150)
  form.setLoading(false)
  form.unsubscribe(id)

  expect(types).toContain(LifeCycleTypes.ON_FORM_MOUNT)
  expect(types).toContain(LifeCycleTypes.ON_FORM_LOADING)
})

test('设置表单加载与校验状态', async () => {
  const form = attach(createForm())
  expect(form.loading).toBeFalsy()
  form.setLoading(true)
  await sleep(150)
  expect(form.loading).toBeTruthy()
  form.setLoading(false)

  expect(form.validating).toBeFalsy()
  form.setValidating(true)
  await sleep(150)
  expect(form.validating).toBeTruthy()
  form.setValidating(false)
})

test('表单卸载后销毁字段', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa' })!)
  expect(form.fields.aa).toBe(field)

  form.onUnmount()
  expect(form.unmounted).toBeTruthy()
  expect(form.fields.aa).toBeUndefined()
})

test('表单值与初始值变更触发生命周期', () => {
  let valuesChangeCount = 0
  let initialValuesChangeCount = 0
  const form = attach(
    createForm({
      effects() {
        onFormValuesChange(() => {
          valuesChangeCount++
        })
        onFormInitialValuesChange(() => {
          initialValuesChangeCount++
        })
      },
    })
  )
  expect(valuesChangeCount).toEqual(0)
  expect(initialValuesChangeCount).toEqual(0)

  form.setValues({ aa: '123' })
  expect(valuesChangeCount).toBeGreaterThan(0)

  form.setInitialValues({ aa: '321', bb: '123' })
  expect(initialValuesChangeCount).toBeGreaterThan(0)
  // 无字段承载时，初始值变更会通过 patchFormValues 回写 values
  expect(form.values.aa).toEqual('321')
  expect(form.values.bb).toEqual('123')
})

test('初始值变更按默认值规则回写表单值', () => {
  const form = attach(createForm())
  form.setValues({ aa: '123' })

  form.setInitialValuesIn('bb', '456')
  expect(form.initialValues.bb).toEqual('456')
  // values 中原本不存在的键会被初始值填充
  expect(form.values.bb).toEqual('456')

  form.setInitialValuesIn('aa', '999')
  // 已有值且无字段承载时同样会被更新
  expect(form.values.aa).toEqual('999')
})

test('覆盖赋值后变更监听仍然生效', () => {
  let valuesChangeCount = 0
  let initialValuesChangeCount = 0
  const form = attach(
    createForm({
      effects() {
        onFormValuesChange(() => {
          valuesChangeCount++
        })
        onFormInitialValuesChange(() => {
          initialValuesChangeCount++
        })
      },
    })
  )

  form.setValues({ aa: 1 }, 'overwrite')
  // 整体替换本身不触发旧对象的监听，关键是替换后的新对象仍能被监听
  form.setValuesIn('aa', 2)
  expect(valuesChangeCount).toBeGreaterThan(0)
  const countAfterMutation = valuesChangeCount

  form.setInitialValues({ bb: 1 }, 'overwrite')
  expect(initialValuesChangeCount).toEqual(0)

  // initialValues 被整体替换后，监听器同样应重新订阅到新对象
  form.setInitialValuesIn('bb', 2)
  expect(initialValuesChangeCount).toBeGreaterThan(0)
  expect(valuesChangeCount).toBeGreaterThan(countAfterMutation)
})

test('setEffects 注册的变更生命周期正常触发', () => {
  let initialValuesTriggerNum = 0
  let valuesTriggerNum = 0
  const form = attach(
    createForm({
      initialValues: { aa: 1 },
      values: { bb: 1 },
    })
  )

  form.setEffects(() => {
    onFormInitialValuesChange(() => {
      initialValuesTriggerNum++
    })
    onFormValuesChange(() => {
      valuesTriggerNum++
    })
  })

  expect(initialValuesTriggerNum).toEqual(0)
  expect(valuesTriggerNum).toEqual(0)

  form.initialValues.aa = 2
  form.values.bb = 2
  expect(initialValuesTriggerNum).toEqual(1)
  // initialValues 的回写会额外触发一次 values 变更
  expect(valuesTriggerNum).toEqual(2)

  form.setInitialValues({ aa: 3 })
  form.setValues({ bb: 3 })
  expect(initialValuesTriggerNum).toEqual(2)
  expect(valuesTriggerNum).toEqual(4)

  form.initialValues.aa = 4
  form.values.bb = 4
  expect(initialValuesTriggerNum).toEqual(3)
  expect(valuesTriggerNum).toEqual(6)
})

test('表单图快照导出与恢复', () => {
  const form = attach(createForm({ values: { aa: 1 } }))
  attach(form.createField({ name: 'aa', title: '字段一' }))

  const graph = form.graph.getGraph()
  expect(graph['']).toBeDefined()
  expect(graph.aa).toMatchObject({ address: 'aa', title: '字段一' })

  const restored = attach(createForm())
  restored.graph.setGraph(graph)
  expect(restored.fields.aa).not.toBeUndefined()
  expect(restored.fields.aa.title).toEqual('字段一')
  expect(restored.values.aa).toEqual(1)
})
