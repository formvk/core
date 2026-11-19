import { mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { computed, defineComponent, h, nextTick } from 'vue'

import {
  FormProvider,
  RecursionField,
  SchemaField,
  connect,
  createForm,
  mapProps,
  mapReadPretty,
  useField,
  useFieldSchema,
} from '..'
import { ReactiveField } from '../components/ReactiveField'
import { Container, Decorator, Input, mountWithForm } from './shared'

const Text = defineComponent({
  name: 'Text',
  props: ['value', 'text', 'title'],
  setup(props) {
    return () => (
      <span class="text" data-value={props.value} data-text={props.text}>
        {props.title ?? props.value}
      </span>
    )
  },
})

const ReadPretty = defineComponent({
  name: 'ReadPretty',
  setup() {
    return () => <span class="read-pretty">readPretty</span>
  },
})

const SlotViewer = defineComponent({
  name: 'SlotViewer',
  setup(_, { slots }) {
    return () => (
      <div class="slot-viewer">
        <div class="named">{slots.label?.()}</div>
        <div class="default">{slots.default?.()}</div>
      </div>
    )
  },
})

const components = { Input, Decorator, Container, SlotViewer }

describe('schema 驱动的字段渲染', () => {
  test('数据字段基础渲染：decorator + component', () => {
    const form = createForm({ values: { username: 'init' } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: {
              type: 'string',
              decorator: 'Decorator',
              component: 'Input',
            },
          },
        }}
      />
    ))

    expect(wrapper.find('.decorator').exists()).toBe(true)
    expect(wrapper.find('input').element.value).toBe('init')
    // 无名 object 根节点用 display: contents 包裹子节点
    expect(wrapper.html()).toContain('display: contents')
  })

  test('component / decorator 支持字符串解析与组件对象', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            byName: { type: 'string', decorator: 'Decorator', component: 'Input' },
            byObject: { type: 'string', decorator: Decorator, component: Input },
          },
        }}
      />
    ))

    expect(wrapper.findAll('.decorator')).toHaveLength(2)
    expect(wrapper.findAll('input')).toHaveLength(2)
  })

  test('无 decorator 只渲染 component；无 component 时渲染 content', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            plain: { type: 'string', component: 'Input' },
            contentOnly: { type: 'string', component: 'SlotViewer', content: 'hello' },
          },
        }}
      />
    ))

    expect(wrapper.find('.decorator').exists()).toBe(false)
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('.slot-viewer .default').text()).toBe('hello')
  })

  test('object / array / void 节点的插槽透传', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            obj: {
              type: 'object',
              component: 'Container',
              properties: {
                a: { type: 'string', component: 'Input' },
              },
            },
            list: {
              type: 'array',
              component: 'Container',
              items: { type: 'string', component: 'Input' },
            },
            voidField: {
              type: 'void',
              component: 'Container',
              properties: {
                b: { type: 'string', component: 'Input' },
              },
            },
          },
        }}
      />
    ))

    const containers = wrapper.findAll('.container')
    expect(containers).toHaveLength(3)
    expect(containers[0].find('input').exists()).toBe(true)
    expect(containers[2].find('input').exists()).toBe(true)
    expect((form.fields['list'] as any).displayName).toBe('ArrayField')
  })

  test('value 受控：字段值与输入事件双向同步', async () => {
    const form = createForm<{ username?: string }>({ values: { username: 'init' } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: { type: 'string', component: 'Input' },
          },
        }}
      />
    ))

    const input = wrapper.find('input')
    expect(input.element.value).toBe('init')

    await input.setValue('changed')
    expect(form.values.username).toBe('changed')

    form.setValuesIn('username', 'remote')
    await nextTick()
    expect(input.element.value).toBe('remote')
  })

  test('componentProps 中 onUpdate:modelValue / @update:modelValue 都驱动字段，后者优先', async () => {
    const onChange = vi.fn()
    const atChange = vi.fn()
    const form = createForm<{ username?: string; nickname?: string }>()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: {
              type: 'string',
              component: 'Input',
              componentProps: { 'onUpdate:modelValue': onChange },
            },
            nickname: {
              type: 'string',
              component: 'Input',
              componentProps: { 'onUpdate:modelValue': onChange, '@update:modelValue': atChange },
            },
          },
        }}
      />
    ))

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('a')
    expect(form.values.username).toBe('a')
    expect(onChange).toHaveBeenCalled()

    await inputs[1].setValue('b')
    expect(form.values.nickname).toBe('b')
    expect(atChange).toHaveBeenCalled()
    // @update:modelValue 覆盖 onUpdate:modelValue，后者不重复触发
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('组件通过 v-model 读写字段值', async () => {
    let receivedProps: Record<string, any> = {}
    let receivedAttrs: Record<string, any> = {}
    const ModelInput = defineComponent({
      name: 'ModelInput',
      props: { modelValue: String },
      emits: ['update:modelValue'],
      setup(props, { attrs, emit }) {
        receivedProps = props as Record<string, any>
        receivedAttrs = attrs
        // 组件内直接用 JSX v-model：写值经 setter emit 回适配层
        const model = computed({
          get: () => props.modelValue,
          set: value => emit('update:modelValue', value),
        })
        return () => <input class="model-input" v-model={model.value} />
      },
    })
    const form = createForm<{ username?: string }>()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ ...components, ModelInput }}
        schema={{
          type: 'object',
          properties: {
            username: {
              type: 'string',
              component: 'ModelInput',
            },
          },
        }}
      />
    ))

    // v-model 契约：不再注入 value / onChange
    expect('value' in receivedProps).toBe(false)
    expect('onChange' in receivedAttrs).toBe(false)

    const input = wrapper.find('input')
    await input.setValue('v-model')
    await nextTick()
    expect(form.values.username).toBe('v-model')
    expect(receivedProps.modelValue).toBe('v-model')

    form.setValuesIn('username', 'remote')
    await nextTick()
    expect(receivedProps.modelValue).toBe('remote')
    expect((input.element as HTMLInputElement).value).toBe('remote')
  })

  test('组件可通过 props 直接调用 onUpdate:modelValue 写回字段', async () => {
    const DirectModelInput = defineComponent({
      name: 'DirectModelInput',
      props: {
        modelValue: String,
        'onUpdate:modelValue': Function,
      },
      setup(props) {
        return () => (
          <button type="button" class="direct-model" onClick={() => props['onUpdate:modelValue']?.('direct')}>
            {props.modelValue ?? ''}
          </button>
        )
      },
    })
    const form = createForm<{ username?: string }>()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ ...components, DirectModelInput }}
        schema={{
          type: 'object',
          properties: {
            username: {
              type: 'string',
              component: 'DirectModelInput',
            },
          },
        }}
      />
    ))

    const button = wrapper.find('button')
    expect(button.text()).toBe('')
    await button.trigger('click')
    await nextTick()
    expect(form.values.username).toBe('direct')
    expect(button.text()).toBe('direct')
  })

  test('无冒号的 onUpdateModelValue 不属于 v-model 契约，不会写回字段', async () => {
    let receivedProps: Record<string, any> = {}
    const LegacyModelInput = defineComponent({
      name: 'LegacyModelInput',
      props: {
        modelValue: String,
        onUpdateModelValue: Function,
      },
      setup(props) {
        receivedProps = props as Record<string, any>
        return () => (
          <button type="button" class="legacy-model" onClick={() => props.onUpdateModelValue?.('legacy')}>
            {props.modelValue ?? ''}
          </button>
        )
      },
    })
    const form = createForm<{ username?: string }>()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ ...components, LegacyModelInput }}
        schema={{
          type: 'object',
          properties: {
            username: {
              type: 'string',
              component: 'LegacyModelInput',
            },
          },
        }}
      />
    ))

    // 适配层只注入带冒号的 onUpdate:modelValue，不会传 onUpdateModelValue
    expect(receivedProps.onUpdateModelValue).toBeUndefined()

    const button = wrapper.find('button')
    await button.trigger('click')
    await nextTick()
    expect(form.values.username).toBeUndefined()
    expect(button.text()).toBe('')
  })

  test('原生 input 标签通过 v-model 指令读写字段值', async () => {
    const form = createForm<{ username?: string }>({ values: { username: 'init' } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: { type: 'string', component: 'input' },
          },
        }}
      />
    ))

    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe('init')

    await input.setValue('native')
    expect(form.values.username).toBe('native')

    form.setValuesIn('username', 'remote')
    await nextTick()
    expect((input.element as HTMLInputElement).value).toBe('remote')

    // 原生元素走 vModelText 指令：IME 拼字期间不写回，compositionend 后同步
    const element = input.element as HTMLInputElement
    element.dispatchEvent(new Event('compositionstart'))
    element.value = '拼'
    element.dispatchEvent(new Event('input'))
    await nextTick()
    expect(form.values.username).toBe('remote')

    element.dispatchEvent(new Event('compositionend'))
    await nextTick()
    expect(form.values.username).toBe('拼')
  })

  test('原生 checkbox 通过 v-model 指令读写布尔值', async () => {
    const form = createForm<{ agree?: boolean }>({ values: { agree: false } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            agree: {
              type: 'boolean',
              component: 'input',
              componentProps: { type: 'checkbox' },
            },
          },
        }}
      />
    ))

    const checkbox = wrapper.find('input')
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)

    await checkbox.setValue(true)
    expect(form.values.agree).toBe(true)
  })

  test('原生 select 通过 v-model 指令读写字段值', async () => {
    const form = createForm<{ city?: string }>({ values: { city: 'sh' } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            city: {
              type: 'string',
              component: 'select',
              componentProps: {
                innerHTML: '<option value="sh">上海</option><option value="bj">北京</option>',
              },
            },
          },
        }}
      />
    ))

    const select = wrapper.find('select')
    expect((select.element as HTMLSelectElement).value).toBe('sh')

    await select.setValue('bj')
    expect(form.values.city).toBe('bj')

    form.setValuesIn('city', 'sh')
    await nextTick()
    expect((select.element as HTMLSelectElement).value).toBe('sh')
  })

  test('无 v-model 语义的字符串标签保留 value + change 写回', async () => {
    const onChange = vi.fn()
    const form = createForm<{ code?: string }>({ values: { code: 'init' } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            code: {
              type: 'string',
              component: 'my-input',
              componentProps: { onChange },
            },
          },
        }}
      />
    ))

    const custom = wrapper.find('my-input')
    expect(custom.attributes('value')).toBe('init')

    const element = custom.element as any
    // 自定义元素没有 value 反射，手动补一个属性以模拟控件行为
    element.value = 'changed'
    await custom.trigger('change')
    expect(form.values.code).toBe('changed')
    expect(onChange).toHaveBeenCalledTimes(1)

    form.setValuesIn('code', 'remote')
    await nextTick()
    // 元素上已有 value 属性后，Vue 会以 DOM property 方式更新
    expect(element.value).toBe('remote')
  })

  test('原生 file input 不挂 v-model 指令，避免给只读 value 赋值', async () => {
    const form = createForm<{ file?: string }>({ values: { file: 'picked.txt' } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            file: {
              type: 'string',
              component: 'input',
              componentProps: { type: 'file' },
            },
          },
        }}
      />
    ))

    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).type).toBe('file')
    expect((input.element as HTMLInputElement).value).toBe('')

    // 字段值变化不会尝试写入 file input 的只读 value
    form.setValuesIn('file', 'next.txt')
    await nextTick()
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  test('onFocus / onBlur 触发字段 focus / blur', async () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: { type: 'string', component: 'Input' },
          },
        }}
      />
    ))

    const field = form.fields['username'] as any
    await wrapper.find('input').trigger('focus')
    expect(field.active).toBe(true)

    await wrapper.find('input').trigger('blur')
    expect(field.active).toBe(false)
  })

  test('pattern 驱动 disabled / readOnly', async () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: { type: 'string', component: 'Input' },
          },
        }}
      />
    ))

    form.setPattern('disabled')
    await nextTick()
    expect(wrapper.find('input').element.hasAttribute('disabled')).toBe(true)

    form.setPattern('readOnly')
    await nextTick()
    expect(wrapper.find('input').element.hasAttribute('readonly')).toBe(true)
    expect(wrapper.find('input').element.hasAttribute('disabled')).toBe(false)

    form.setPattern('readPretty')
    await nextTick()
    expect(wrapper.find('input').element.hasAttribute('disabled')).toBe(true)
  })

  test('display 从 none 切到 visible 时重新渲染', async () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: { type: 'string', component: 'Input', display: 'none' },
          },
        }}
      />
    ))

    expect(wrapper.find('input').exists()).toBe(false)

    form.setFieldState('username', state => {
      state.display = 'visible'
    })
    await nextTick()
    expect(wrapper.find('input').exists()).toBe(true)
  })

  test('content 支持字符串、具名插槽对象、VNode', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            text: { type: 'string', component: 'SlotViewer', content: 'plain' },
            named: {
              type: 'string',
              component: 'SlotViewer',
              content: { label: 'LBL', default: 'DEF' },
            },
            vnode: {
              type: 'string',
              component: 'SlotViewer',
              content: <span class="vnode-content">V</span>,
            },
          },
        }}
      />
    ))

    const viewers = wrapper.findAll('.slot-viewer')
    expect(viewers[0].find('.default').text()).toBe('plain')
    expect(viewers[1].find('.named').text()).toBe('LBL')
    expect(viewers[1].find('.default').text()).toBe('DEF')
    expect(viewers[2].find('.vnode-content').text()).toBe('V')
  })

  test('connect + mapProps（含 value 删除分支）与 mapReadPretty', async () => {
    const Connected = connect(Text, mapProps({ value: 'value', title: 'title' }), mapReadPretty(ReadPretty))
    const ValueMapped = connect(Text, mapProps({ value: 'text' }))

    const form = createForm({ values: { mapped: 'mapped-value' } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ Connected, ValueMapped }}
        schema={{
          type: 'object',
          properties: {
            mapped: {
              type: 'string',
              title: 'Title',
              component: 'Connected',
            },
            deleted: {
              type: 'string',
              component: 'ValueMapped',
            },
          },
        }}
      />
    ))

    const mapped = wrapper.find('.text')
    expect(mapped.text()).toBe('Title')
    expect(mapped.attributes('data-value')).toBe('mapped-value')

    form.setPattern('readPretty')
    await nextTick()
    expect(wrapper.find('.read-pretty').exists()).toBe(true)

    form.setPattern('editable')
    await nextTick()
    const valueMapped = wrapper.findAll('.text').at(-1)!
    expect(valueMapped.attributes('data-text')).toBeUndefined()
    expect(valueMapped.attributes('data-value')).toBeUndefined()
  })

  test('schema 变化后创建新字段并卸载旧字段', async () => {
    const form = createForm()
    let schema: any = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input' },
      },
    }
    const wrapper = mountWithForm(form, () => <SchemaField components={components} schema={schema} />)

    const first = form.fields['a'] as any
    expect(first.mounted).toBe(true)

    schema = {
      type: 'object',
      properties: {
        b: { type: 'string', component: 'Input' },
      },
    }
    // 触发挂载组件的重渲染
    wrapper.vm.$forceUpdate()
    await nextTick()
    await nextTick()

    expect(first.unmounted).toBe(true)
    expect((form.fields['b'] as any)?.displayName).toBe('Field')
    expect(wrapper.find('input').element.getAttribute('data-testid')).toBe('b')
  })
})

describe('边界与降级渲染', () => {
  test('content 的空值与数字内容不渲染', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            partial: {
              type: 'string',
              component: 'SlotViewer',
              content: { label: null, default: 5 } as any,
            },
            numeric: { type: 'string', component: 'SlotViewer', content: 123 as any },
          },
        }}
      />
    ))

    const viewers = wrapper.findAll('.slot-viewer')
    expect(viewers[0].find('.named').text()).toBe('')
    expect(viewers[0].find('.default').text()).toBe('5')
    expect(viewers[1].find('.default').text()).toBe('')
  })

  test('ReactiveField content 支持函数组件与对象组件', async () => {
    const FnContent = () => <span class="direct-fn">fn</span>
    const ObjectContent = defineComponent({
      setup() {
        return () => <span class="direct-object">object</span>
      },
    })
    const Viewer = defineComponent({
      setup(_, { slots }) {
        return () => <div class="direct-viewer">{slots.default?.()}</div>
      },
    })
    const form = createForm()
    const Direct = defineComponent({
      setup() {
        return () =>
          h(FormProvider, { form }, () =>
            h(ReactiveField as any, { fieldProps: { name: 'directContent' } }, { default: undefined } as any)
          )
      },
    })
    const wrapper = mount(Direct)

    const field = form.fields['directContent'] as any
    field.component = Viewer
    field.content = FnContent
    await nextTick()
    expect(wrapper.find('.direct-viewer .direct-fn').text()).toBe('fn')

    field.content = ObjectContent
    await nextTick()
    expect(wrapper.find('.direct-viewer .direct-object').text()).toBe('object')
  })

  test('object 无 component / decorator 且多子节点时以 Fragment 渲染', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            obj: {
              type: 'object',
              properties: {
                a: { type: 'string', component: 'Input' },
                b: { type: 'string', component: 'Input' },
              },
            },
          },
        }}
      />
    ))

    expect(wrapper.findAll('input')).toHaveLength(2)
    expect((form.fields['obj'] as any).displayName).toBe('ObjectField')
  })

  test('object 无子属性时不渲染内容', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField components={components} schema={{ type: 'object', properties: { blank: { type: 'object' } } }} />
    ))

    expect(wrapper.find('input').exists()).toBe(false)
    expect((form.fields['blank'] as any).displayName).toBe('ObjectField')
  })

  test('object 无子属性且 content 默认插槽为空时渲染为空', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            blank: { type: 'object', content: { default: [] } as any },
          },
        }}
      />
    ))

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('.slot-viewer').exists()).toBe(false)
  })

  test('未注册的组件名按原生标签渲染', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            native: { type: 'string', component: 'section', content: 'native-text' },
          },
        }}
      />
    ))

    expect(wrapper.find('section').text()).toBe('native-text')
  })

  test('object 同时配置 content 与子属性时合并插槽内容', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            box: {
              type: 'object',
              component: 'Container',
              content: 'extra',
              properties: {
                a: { type: 'string', component: 'Input' },
              },
            },
          },
        }}
      />
    ))

    expect(wrapper.find('.container input').exists()).toBe(true)
    expect(wrapper.find('.container').text()).toContain('extra')
  })

  test('decoratorProps / componentProps 被清空后仍可渲染', async () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            a: {
              type: 'string',
              decorator: 'Decorator',
              decoratorProps: { label: 'L' },
              component: 'Input',
              componentProps: { placeholder: 'P' },
            },
          },
        }}
      />
    ))

    expect(wrapper.find('input').attributes('placeholder')).toBe('P')

    const field = form.fields['a'] as any
    field.decoratorProps = undefined
    field.componentProps = undefined
    await nextTick()

    expect(wrapper.find('.decorator').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('input').attributes('placeholder')).toBeUndefined()
  })

  test('void 字段的 component 事件不写入字段状态', async () => {
    const onChange = vi.fn()
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            v: {
              type: 'void',
              component: 'Input',
              componentProps: { 'onUpdate:modelValue': onChange, onFocus, onBlur },
            },
          },
        }}
      />
    ))

    const input = wrapper.find('input')
    await input.trigger('input')
    await input.trigger('focus')
    await input.trigger('blur')

    expect(onChange).toHaveBeenCalled()
    expect(onFocus).toHaveBeenCalled()
    expect(onBlur).toHaveBeenCalled()

    const field = form.fields['v'] as any
    expect(field.displayName).toBe('VoidField')
    expect(field.value).toBeUndefined()
  })

  test('同名字段 schema 更新时触发字段重建逻辑', async () => {
    const form = createForm()
    let schema: any = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input' },
      },
    }
    const wrapper = mountWithForm(form, () => <SchemaField components={components} schema={schema} />)
    const first = form.fields['a']

    schema = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input', title: 'updated' },
      },
    }
    wrapper.vm.$forceUpdate()
    await nextTick()
    await nextTick()

    expect(form.fields['a']).toBe(first)
    expect(wrapper.find('input').exists()).toBe(true)
  })

  test('ReactiveField 无表单上下文或字段缺失时回退渲染插槽', () => {
    const bare = mount(ReactiveField)
    expect(bare.findAll('.fallback')).toHaveLength(0)

    const fallback = mount(ReactiveField, {
      slots: { default: () => <span class="fallback">fallback</span> },
    })
    expect(fallback.find('.fallback').exists()).toBe(true)

    const form = createForm()
    const Direct = defineComponent({
      setup() {
        return () =>
          h(FormProvider, { form }, () =>
            h(ReactiveField as any, { fieldType: null, fieldProps: null } as any, { default: () => undefined })
          )
      },
    })
    mount(Direct)
    expect(Object.keys(form.fields)).toHaveLength(0)
  })

  test('connect / mapProps 支持函数映射、非字符串映射与匿名组件', () => {
    const Anon = defineComponent({
      props: ['title', 'placeholder'],
      setup(props) {
        return () => <span class="anon">{`${props.title ?? ''}|${props.placeholder ?? ''}`}</span>
      },
    })
    const FnMapped = connect(
      Anon,
      mapProps((props: any) => ({ ...props, title: 'fn-title' }))
    )
    const SkipMapped = connect(Anon, mapProps({ placeholder: 'placeholder' }))
    const BoolMapped = connect(Anon, mapProps({ title: false } as any))
    // 匿名组件的 mapReadPretty 使用降级组件名
    connect(
      Anon,
      mapReadPretty(() => <span class="read-anon">read</span>)
    )

    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ FnMapped, SkipMapped, BoolMapped }}
        schema={{
          type: 'object',
          properties: {
            fn: { type: 'string', component: 'FnMapped' },
            skip: {
              type: 'string',
              component: 'SkipMapped',
              componentProps: { placeholder: 'from-schema' },
            },
            bool: { type: 'string', title: 'title-value', component: 'BoolMapped' },
          },
        }}
      />
    ))

    const anons = wrapper.findAll('.anon')
    expect(anons[0].text()).toBe('fn-title|')
    expect(anons[1].text()).toBe('|from-schema')
    expect(anons[2].text()).toBe('title-value|')

    const DirectConnected = connect(Anon, mapProps({ title: 'title' }))
    const direct = mount(DirectConnected, { props: { title: 'direct-title' } })
    expect(direct.find('.anon').text()).toBe('direct-title|')
  })
})

describe('数组字段图变更后的字段重绑定', () => {
  const IndexArrayList = defineComponent({
    name: 'IndexArrayList',
    setup() {
      const fieldRef = useField()
      const schemaRef = useFieldSchema()
      return () => {
        const field = fieldRef.value as any
        const items = (schemaRef.value as any)?.items
        return (
          <div class="index-array">
            {(field.value ?? []).map((_item: any, index: number) => (
              <div key={index}>
                <RecursionField schema={items} name={index} basePath={field.address} />
              </div>
            ))}
          </div>
        )
      }
    },
  })

  test('索引 key 下删除 / 插入数组项后视图跟随字段迁移', async () => {
    const form = createForm({ values: { users: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ ...components, IndexArrayList }}
        schema={{
          type: 'object',
          properties: {
            users: {
              type: 'array',
              component: 'IndexArrayList',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', component: 'Input' },
                },
              },
            },
          },
        }}
      />
    ))
    const readValues = () => wrapper.findAll('input').map(input => (input.element as HTMLInputElement).value)
    const arrayField = form.query('users').take() as any

    expect(readValues()).toEqual(['a', 'b', 'c'])

    arrayField.remove(0)
    await nextTick()
    expect(readValues()).toEqual(['b', 'c'])

    // 重绑定后的第一行应写入 users.0，而不是已销毁的旧字段
    await wrapper.findAll('input')[0].setValue('b2')
    expect((form.values as any).users).toEqual([{ name: 'b2' }, { name: 'c' }])

    arrayField.unshift({ name: 'x' })
    await nextTick()
    expect(readValues()).toEqual(['x', 'b2', 'c'])

    await wrapper.findAll('input')[1].setValue('b3')
    expect((form.values as any).users).toEqual([{ name: 'x' }, { name: 'b3' }, { name: 'c' }])
    wrapper.unmount()
  })
})
