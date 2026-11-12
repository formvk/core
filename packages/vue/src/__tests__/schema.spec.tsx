import { describe, expect, test } from 'vitest'
import { defineComponent, nextTick } from 'vue'

import { RecursionField, Schema, SchemaField, createForm, createSchemaField, useField, useFieldSchema } from '..'
import { Input, mountWithForm } from './shared'

const SlotContainer = defineComponent({
  name: 'SlotContainer',
  setup(_, { slots }) {
    return () => (
      <div class="slot-container">
        <div class="header">{slots.header?.()}</div>
        <div class="default">{slots.default?.()}</div>
      </div>
    )
  },
})

const ArrayList = defineComponent({
  name: 'ArrayList',
  setup() {
    const fieldRef = useField()
    const schemaRef = useFieldSchema()
    return () => {
      const field = fieldRef.value as any
      const items = (schemaRef.value as any)?.items
      const list = Array.isArray(field?.value) ? field.value : []
      return (
        <div class="array-list">
          {list.map((_: any, index: number) => (
            <RecursionField key={index} schema={items} name={index} basePath={field.address} />
          ))}
        </div>
      )
    }
  },
})

describe('SchemaField / RecursionField', () => {
  test('JSON schema 基础渲染：object 下的 string / boolean / number 子字段', () => {
    const form = createForm({ values: { s: 'text', b: true, n: 3 } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ Input }}
        schema={{
          type: 'object',
          properties: {
            s: { type: 'string', component: 'Input' },
            b: { type: 'boolean', component: 'Input' },
            n: { type: 'number', component: 'Input' },
          },
        }}
      />
    ))

    const inputs = wrapper.findAll('input')
    expect(inputs.map(input => input.element.value)).toEqual(['text', 'true', '3'])
    expect(inputs.map(input => input.attributes('data-testid'))).toEqual(['s', 'b', 'n'])
    expect((form.fields['b'] as any).displayName).toBe('Field')
  })

  test('properties 的 index 控制渲染顺序', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ Input }}
        schema={{
          type: 'object',
          properties: {
            a: { type: 'string', component: 'Input', index: 2 },
            b: { type: 'string', component: 'Input', index: 0 },
            c: { type: 'string', component: 'Input', index: 1 },
          },
        }}
      />
    ))

    expect(wrapper.findAll('input').map(input => input.attributes('data-testid'))).toEqual(['b', 'c', 'a'])
  })

  test('onlyRenderSelf 只创建自身字段，onlyRenderProperties 只渲染子属性', () => {
    const selfForm = createForm()
    const selfWrapper = mountWithForm(selfForm, () => (
      <SchemaField
        name="obj"
        onlyRenderSelf
        components={{ Input }}
        schema={{
          type: 'object',
          properties: {
            a: { type: 'string', component: 'Input' },
          },
        }}
      />
    ))

    expect(selfForm.fields['obj']).toBeTruthy()
    expect(selfForm.fields['obj.a']).toBeUndefined()
    expect(selfWrapper.find('input').exists()).toBe(false)

    const propsForm = createForm()
    const propsWrapper = mountWithForm(propsForm, () => (
      <SchemaField
        name="obj"
        onlyRenderProperties
        components={{ Input }}
        schema={{
          type: 'object',
          properties: {
            a: { type: 'string', component: 'Input' },
          },
        }}
      />
    ))

    expect(propsForm.fields['obj']).toBeUndefined()
    expect(propsForm.fields['obj.a']).toBeTruthy()
    expect(propsWrapper.find('input').exists()).toBe(true)
  })

  test('mapProperties 替换子 schema，filterProperties 过滤子节点', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ Input }}
        mapProperties={(schema: any, name: string) =>
          name === 'a' ? { type: 'string', component: 'Input', componentProps: { placeholder: 'mapped' } } : undefined
        }
        filterProperties={(_schema: any, name: string) => name !== 'b'}
        schema={{
          type: 'object',
          properties: {
            a: { type: 'string', component: 'Input' },
            b: { type: 'string', component: 'Input' },
            c: { type: 'string', component: 'Input' },
          },
        }}
      />
    ))

    expect(wrapper.findAll('input')).toHaveLength(2)
    expect(wrapper.find('[data-testid="a"]').attributes('placeholder')).toBe('mapped')
    expect(wrapper.find('[data-testid="b"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="c"]').exists()).toBe(true)
  })

  test('void 字段通过 slot 把子节点渲染到具名插槽', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ Input, SlotContainer }}
        schema={{
          type: 'object',
          properties: {
            v: {
              type: 'void',
              component: 'SlotContainer',
              properties: {
                a: { type: 'string', component: 'Input', slot: 'header' },
              },
            },
          },
        }}
      />
    ))

    expect(wrapper.find('.slot-container .header input').exists()).toBe(true)
    expect(wrapper.find('.slot-container .default').text()).toBe('')
    expect((form.fields['v'] as any).displayName).toBe('VoidField')
  })

  test('array 字段按 items 渲染子节点', () => {
    const form = createForm({ values: { arr: ['x', 'y'] } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ Input, ArrayList }}
        schema={{
          type: 'object',
          properties: {
            arr: {
              type: 'array',
              component: 'ArrayList',
              items: { type: 'string', component: 'Input' },
            },
          },
        }}
      />
    ))

    const inputs = wrapper.findAll('input')
    expect(inputs[0].attributes('data-testid')).toBe('arr.0')
    expect(inputs[1].attributes('data-testid')).toBe('arr.1')
    expect(inputs.map(input => input.element.value)).toEqual(['x', 'y'])
    expect((form.fields['arr'] as any).displayName).toBe('ArrayField')
  })

  test('scope 表达式读取 $values 并在依赖值变化后重新编译', async () => {
    const form = createForm({ values: { source: 'abc' } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ Input }}
        schema={{
          type: 'object',
          properties: {
            source: { type: 'string', component: 'Input' },
            target: {
              type: 'string',
              component: 'Input',
              componentProps: { placeholder: '{{$values.source}}' },
            },
          },
        }}
      />
    ))

    expect(wrapper.find('[data-testid="target"]').attributes('placeholder')).toBe('abc')

    form.setValuesIn('source', 'changed')
    await nextTick()

    expect(wrapper.find('[data-testid="target"]').attributes('placeholder')).toBe('changed')
  })

  test('reactions 的 dependencies / when 驱动 visible 变化', async () => {
    const form = createForm({ values: { hide: false } })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ Input }}
        schema={{
          type: 'object',
          properties: {
            hide: { type: 'boolean', component: 'Input' },
            target: {
              type: 'string',
              component: 'Input',
              reactions: [
                {
                  dependencies: ['hide'],
                  when: '{{$values.hide === true}}',
                  fulfill: { state: { visible: false } },
                  otherwise: { state: { visible: true } },
                },
              ],
            },
          },
        }}
      />
    ))

    expect(wrapper.find('[data-testid="target"]').exists()).toBe(true)

    form.setValuesIn('hide', true)
    await nextTick()
    expect(wrapper.find('[data-testid="target"]').exists()).toBe(false)

    form.setValuesIn('hide', false)
    await nextTick()
    expect(wrapper.find('[data-testid="target"]').exists()).toBe(true)
  })

  test('createSchemaField 预绑定组件，运行时 components 覆盖同名组件', () => {
    const InputA = defineComponent({
      name: 'InputA',
      props: ['value'],
      setup(props) {
        return () => <input class="input-a" value={props.value} />
      },
    })
    const InputB = defineComponent({
      name: 'InputB',
      props: ['value'],
      setup(props) {
        return () => <input class="input-b" value={props.value} />
      },
    })

    const { SchemaField: BoundSchemaField } = createSchemaField({
      components: { Input: InputA },
    })
    const schema = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input' },
      },
    }

    const formA = createForm()
    const wrapperA = mountWithForm(formA, () => <BoundSchemaField schema={schema} />)
    expect(wrapperA.find('.input-a').exists()).toBe(true)
    expect(wrapperA.find('.input-b').exists()).toBe(false)

    const formB = createForm()
    const wrapperB = mountWithForm(formB, () => <BoundSchemaField components={{ Input: InputB }} schema={schema} />)
    expect(wrapperB.find('.input-b').exists()).toBe(true)
    expect(wrapperB.find('.input-a').exists()).toBe(false)
  })

  test('schema 引用变化后重建字段并渲染新节点', async () => {
    const form = createForm()
    let schema: any = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input' },
      },
    }
    const wrapper = mountWithForm(form, () => <SchemaField components={{ Input }} schema={schema} />)

    const first = form.fields['a'] as any
    expect(first.mounted).toBe(true)

    schema = {
      type: 'object',
      properties: {
        b: { type: 'string', component: 'Input' },
      },
    }
    wrapper.vm.$forceUpdate()
    await nextTick()
    await nextTick()

    expect(first.unmounted).toBe(true)
    expect(form.fields['b']).toBeTruthy()
    expect(wrapper.find('input').attributes('data-testid')).toBe('b')
  })

  test('schema prop 支持直接传入 Schema 实例', () => {
    const form = createForm({ values: { a: 'instance' } })
    const schema = new Schema({
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input' },
      },
    })
    const wrapper = mountWithForm(form, () => <SchemaField components={{ Input }} schema={schema} />)

    expect(wrapper.find('input').element.value).toBe('instance')
  })

  test('无 properties 的 object schema 渲染为空', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => <SchemaField components={{ Input }} schema={{ type: 'object' }} />)

    expect(wrapper.find('input').exists()).toBe(false)
    expect(Object.keys(form.fields)).toHaveLength(0)
  })

  test('onlyRenderProperties 无 name 时渲染当前 schema 的子属性', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        onlyRenderProperties
        components={{ Input }}
        schema={{
          type: 'object',
          properties: {
            a: { type: 'string', component: 'Input' },
          },
        }}
      />
    ))

    expect(wrapper.find('input').attributes('data-testid')).toBe('a')
  })

  test('void + onlyRenderProperties 只渲染子属性且不创建自身字段', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        name="v"
        onlyRenderProperties
        components={{ Input }}
        schema={{
          type: 'void',
          properties: {
            a: { type: 'string', component: 'Input' },
          },
        }}
      />
    ))

    expect(form.fields['v']).toBeUndefined()
    expect(form.fields['v.a']).toBeTruthy()
    expect(wrapper.find('input').attributes('data-testid')).toBe('v.a')
  })
})
