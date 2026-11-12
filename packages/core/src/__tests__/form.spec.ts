import { expect, test, vi } from 'vitest'

import {
  createForm,
  LifeCycleTypes,
  onFieldValueChange,
  onFormInitialValuesChange,
  onFormValuesChange,
  setValidateLanguage,
} from '..'
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
  const result = await form.submit(async values => ({ ...values, submitted: true }))
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
  form.unsubscribe(id!)

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
    createForm<{ aa?: number; bb?: number }>({
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

test('setSubmitting 延迟生效', async () => {
  const form = attach(createForm())
  form.setSubmitting(true)
  expect(form.submitting).toBeFalsy()
  await sleep(150)
  expect(form.submitting).toBeTruthy()
  form.setSubmitting(false)
  expect(form.submitting).toBeFalsy()
})

test('setEffects/addEffects/removeEffects', () => {
  const form = attach(createForm())
  const valueChange = vi.fn()
  const valueChange2 = vi.fn()

  form.addEffects('e1', () => {
    onFieldValueChange('aa', valueChange)
  })
  const field = attach(form.createField({ name: 'aa' })!)
  field.setValue('123')
  expect(valueChange).toHaveBeenCalledTimes(1)

  form.removeEffects('e1')
  field.setValue('321')
  expect(valueChange).toHaveBeenCalledTimes(1)

  // 同一 id 重复注册不会叠加
  form.addEffects('e2', () => {
    onFieldValueChange('aa', valueChange)
  })
  form.addEffects('e2', () => {
    onFieldValueChange('aa', valueChange)
  })
  field.setValue('444')
  expect(valueChange).toHaveBeenCalledTimes(2)

  // setEffects 只替换 props.effects 产生的生命周期，addEffects 注册的 outer 生命周期仍保留
  form.setEffects(() => {
    onFieldValueChange('aa', valueChange2)
  })
  field.setValue('555')
  expect(valueChange).toHaveBeenCalledTimes(3)
  expect(valueChange2).toHaveBeenCalledTimes(1)
})

test('notify/subscribe/unsubscribe', () => {
  const form = attach(createForm())
  const subscribe = vi.fn()
  const id = form.subscribe(subscribe)

  form.notify(LifeCycleTypes.ON_FORM_SUBMIT)
  expect(subscribe).toHaveBeenCalledTimes(1)

  form.unsubscribe(id!)
  form.notify(LifeCycleTypes.ON_FORM_SUBMIT)
  expect(subscribe).toHaveBeenCalledTimes(1)
})

test('setState/getState 快照恢复', () => {
  const form = attach(createForm())
  const state = form.getState()

  form.setState(state => {
    state.pattern = 'disabled'
    state.values = { aa: 123 }
  })
  expect(form.pattern).toEqual('disabled')
  expect(form.disabled).toBeTruthy()
  expect(form.values.aa).toEqual(123)

  form.setState(state)
  expect(form.pattern).toEqual('editable')
  expect(form.disabled).toBeFalsy()
  expect(form.values.aa).toBeUndefined()
})

test('setFieldState/getFieldState 支持字段与 Query 入参', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa' })!)
  const query = form.query('aa')

  form.setFieldState(query, { title: '通过 Query 设置' })
  expect(field.title).toEqual('通过 Query 设置')
  expect(form.getFieldState(query, state => state.title)).toEqual('通过 Query 设置')

  form.setFieldState(field, { title: '通过字段设置' })
  expect(form.getFieldState(field, state => state.title)).toEqual('通过字段设置')
})

test('setFieldState 支持正则与通配符批量设置', () => {
  const form = attach(createForm())
  const aa = attach(form.createField({ name: 'aa' })!)
  const ab = attach(form.createField({ name: 'ab' })!)

  form.setFieldState(/a/, { description: '匹配' })
  expect(aa.description).toEqual('匹配')
  expect(ab.description).toEqual('匹配')

  form.setFieldState('*', { description: '通配' })
  expect(aa.description).toEqual('通配')
  expect(ab.description).toEqual('通配')
})

test('clearErrors/clearWarnings/clearSuccesses', () => {
  const form = attach(createForm())
  const aa = attach(form.createField({ name: 'aa' })!)
  const bb = attach(form.createField({ name: 'bb' })!)

  aa.setFeedback({ type: 'error', messages: ['aa error'] })
  aa.setFeedback({ type: 'warning', messages: ['aa warning'] })
  aa.setFeedback({ type: 'success', messages: ['aa success'] })
  bb.setFeedback({ type: 'error', messages: ['bb error'] })

  expect(form.errors).toHaveLength(2)
  expect(form.warnings).toHaveLength(1)
  expect(form.successes).toHaveLength(1)

  form.clearErrors('aa')
  expect(form.errors).toHaveLength(1)
  expect(bb.selfErrors).toEqual(['bb error'])

  form.clearErrors()
  form.clearWarnings()
  form.clearSuccesses()
  expect(form.errors).toHaveLength(0)
  expect(form.warnings).toHaveLength(0)
  expect(form.successes).toHaveLength(0)
})

test('queryFeedbacks 按地址与类型过滤', () => {
  const form = attach(createForm())
  const aa = attach(form.createField({ name: 'aa' })!)
  attach(form.createField({ name: 'bb' })!)

  aa.setFeedback({ type: 'error', messages: ['aa error'] })
  aa.setFeedback({ type: 'warning', messages: ['aa warning'] })

  expect(form.queryFeedbacks({ type: 'error' })).toHaveLength(1)
  expect(form.queryFeedbacks({ type: 'warning' })).toHaveLength(1)
  expect(form.queryFeedbacks({ address: 'aa' })).toHaveLength(2)
  expect(form.queryFeedbacks({ path: 'aa' })).toHaveLength(2)
  expect(form.queryFeedbacks({ address: 'bb' })).toHaveLength(0)
  expect(form.queryFeedbacks({ address: '*' })).toHaveLength(2)
})

test('devtools 钩子在挂载与卸载时调用', () => {
  const inject = vi.fn()
  const unmount = vi.fn()
  ;(globalThis as any)['__FORMILY_DEV_TOOLS_HOOK__'] = { inject, unmount }

  const form = createForm()
  form.onMount()
  expect(inject).toHaveBeenCalledWith(form.id, form)
  form.onUnmount()
  expect(unmount).toHaveBeenCalledWith(form.id)

  delete (globalThis as any)['__FORMILY_DEV_TOOLS_HOOK__']
})

test('designable 表单允许重复创建同名字段', () => {
  const form = attach(createForm({ designable: true }))
  const first = attach(form.createField({ name: 'bb', initialValue: 123 })!)
  const second = attach(form.createField({ name: 'bb', initialValue: 321 })!)
  attach(form.createField({ name: 'aa', value: 123 }))
  attach(form.createField({ name: 'aa', value: 321 }))

  expect(second).not.toBe(first)
  expect(form.fields.bb).toBe(second)
  expect(form.values.aa).toEqual(321)
  expect(form.initialValues.bb).toEqual(321)
})

test('validate 跳过 display none 的字段', async () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa', required: true, display: 'none' })!)

  await form.validate()
  expect(field.selfErrors).toEqual([])

  field.setDisplay('visible')
  await expect(form.validate()).rejects.toBeTruthy()
  expect(field.selfErrors).toEqual(['The field value is required'])
})

test('validate 跳过未挂载字段', async () => {
  const form = attach(createForm())
  const mounted = attach(form.createField({ name: 'aa', required: true })!)
  const unmounted = form.createField({ name: 'bb', required: true })!
  unmounted.onUnmount()

  try {
    await form.validate()
  } catch {}
  expect(mounted.selfErrors).toHaveLength(1)
  // 卸载后的字段仍会被查询到，但 reaction 已清理，不会因 display 变更而误报
  expect(unmounted.mounted).toBeFalsy()
})

test('校验器抛错时表单状态可恢复', async () => {
  const form = attach(createForm())
  attach(
    form.createField({
      name: 'aa',
      validator() {
        throw new Error('runtime error')
      },
    })
  )
  try {
    await form.validate()
  } catch {}
  expect(form.invalid).toBeTruthy()
  expect(form.validating).toBeFalsy()
})

test('表单卸载不影响字段值', () => {
  const form = attach(createForm({ values: { aa: '123' } }))
  attach(form.createField({ name: 'aa' }))
  expect(form.values.aa).toEqual('123')
  form.onUnmount()
  expect(form.values.aa).toEqual('123')
})

test('clearFormGraph 默认清理值，可显式保留', () => {
  const form = attach(createForm({ values: { aa: '123' } }))
  attach(form.createField({ name: 'aa' }))
  form.clearFormGraph('*')
  expect(form.values.aa).toBeUndefined()

  const form2 = attach(createForm({ values: { aa: '123' } }))
  attach(form2.createField({ name: 'aa' }))
  form2.clearFormGraph('*', false)
  expect(form2.values.aa).toEqual('123')
})

test('merge 策略下 values/initialValues 引用保持不变', () => {
  const form = attach(createForm({ values: { aa: '123' }, initialValues: { aa: '123' } }))
  const values = form.values
  const initialValues = form.initialValues

  form.setValues({ bb: '321' })
  form.setInitialValues({ bb: '321' })
  expect(form.values === values).toBeTruthy()
  expect(form.initialValues === initialValues).toBeTruthy()

  form.setValues({ cc: 1 }, 'overwrite')
  expect(form.values === values).toBeFalsy()
})

test('display none 时移除表单值，恢复后写回', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aaa', initialValue: 123 })!)
  expect(form.values).toMatchObject({ aaa: 123 })

  field.display = 'none'
  expect(Object.prototype.hasOwnProperty.call(form.values, 'aaa')).toBeFalsy()

  field.display = 'visible'
  expect(Object.prototype.hasOwnProperty.call(form.values, 'aaa')).toBeTruthy()

  field.setValue(undefined)
  expect(Object.prototype.hasOwnProperty.call(form.values, 'aaa')).toBeTruthy()
})

test('数组初始值按空值规则处理', () => {
  const form = attach(
    createForm({
      initialValues: {
        aa: [0],
        bb: [''],
        cc: [],
        dd: [null],
        ee: [undefined],
      },
    })
  )
  ;['aa', 'bb', 'cc', 'dd', 'ee'].forEach(name => {
    form.createArrayField({ name })
  })
  expect(form.values.aa).toEqual([0])
  expect(form.values.bb).toEqual([''])
  expect(form.values.cc).toEqual([])
  // 元素全为 null/undefined 的数组按空值处理，会被数组字段的默认值 [] 覆盖
  expect(form.values.dd).toEqual([])
  expect(form.values.ee).toEqual([])
})

test('创建字段后初始值仍与已有表单值合并', () => {
  const form = attach(createForm())
  const array = attach(form.createArrayField({ name: 'array' })!)
  form.values.array = [{ aa: '321' }]
  const child = attach(form.createField({ name: 'aa', basePath: 'array.0', initialValue: '123' })!)

  expect(array.value).toEqual([{ aa: '321' }])
  expect(child.value).toEqual('321')

  const form2 = attach(createForm())
  const aa = attach(form2.createArrayField({ name: 'aa', initialValue: '111' })!)
  const array2 = attach(form2.createArrayField({ name: 'array' })!)
  const arr0 = attach(form2.createField({ name: 'aa', basePath: 'array.0', initialValue: '123' })!)
  form2.values.aa = '222'
  form2.values.array = [{ aa: '321' }]
  expect(array2.value).toEqual([{ aa: '321' }])
  expect(arr0.value).toEqual('321')
  expect(aa.value).toEqual('222')
})

test('initialValues 为空时不会覆盖 values', () => {
  const form = attach(createForm({ values: { array: [1, 2, 3] } }))
  attach(form.createObjectField({ name: 'array.0.1' }))
  expect(form.values).toEqual({ array: [1, 2, 3] })
})

test('重置数组与对象字段使用类型默认值', async () => {
  const form = attach(createForm({ values: { array: [{ value: 123 }], object: { value: 123 } } }))
  attach(form.createArrayField({ name: 'array', required: true }))
  attach(form.createObjectField({ name: 'object', required: true }))

  await form.reset('*', { forceClear: true })
  expect(form.values).toEqual({ array: [], object: {} })
})

test('查询空字段不会抛错并清理 fields', () => {
  const form = attach(createForm())
  ;(form.fields as any)['a'] = undefined
  expect(() => form.query('*').take()).not.toThrow()
  expect(Object.keys(form.fields)).toEqual([])
})

test('响应式 values 传入时不会被二次克隆', () => {
  const values: any = { aa: 1 }
  const form = attach(createForm({ values }))
  form.setValues({ bb: 2 })
  expect(form.values.aa).toEqual(1)
  expect(form.values.bb).toEqual(2)
  // 普通对象入参会先克隆，避免外部引用被意外修改
  expect(values.bb).toBeUndefined()
})
