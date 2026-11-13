import type { SchemaKey } from '@formvk/schema'
import { describe, expect, expectTypeOf, test } from 'vitest'
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
        mapProperties={(schema: any, name: SchemaKey) =>
          name === 'a' ? { type: 'string', component: 'Input', componentProps: { placeholder: 'mapped' } } : undefined
        }
        filterProperties={(_schema: any, name: SchemaKey) => name !== 'b'}
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

  test('SchemaField 接受扁平 components，同名组件可在 props 层覆盖', () => {
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

    const schema = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input' },
      },
    }

    const formA = createForm()
    const wrapperA = mountWithForm(formA, () => <SchemaField schema={schema} components={{ Input: InputA }} />)
    expect(wrapperA.find('.input-a').exists()).toBe(true)
    expect(wrapperA.find('.input-b').exists()).toBe(false)

    const formB = createForm()
    const wrapperB = mountWithForm(formB, () => <SchemaField components={{ Input: InputB }} schema={schema} />)
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

  test('hotReload：schema 引用变化后按新 schema 重建字段并保留值', async () => {
    const form = createForm({ values: { a: 'keep', b: 'stale' } })
    let schema: any = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input', title: 'old-title' },
        b: { type: 'string', component: 'Input' },
      },
    }
    const wrapper = mountWithForm(form, () => <SchemaField hotReload components={{ Input }} schema={schema} />)

    const firstA = form.fields['a'] as any
    expect(firstA.title).toBe('old-title')

    schema = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input', title: 'new-title' },
        c: { type: 'string', component: 'Input' },
      },
    }
    wrapper.vm.$forceUpdate()
    await nextTick()
    await nextTick()

    expect(form.fields['a']).not.toBe(firstA)
    expect((form.fields['a'] as any).title).toBe('new-title')
    expect(form.values.a).toBe('keep')
    expect(form.values.b).toBeUndefined()
    expect(form.fields['b']).toBeUndefined()
    expect(form.fields['c']).toBeTruthy()
    expect(wrapper.findAll('input').map(input => input.attributes('data-testid'))).toEqual(['a', 'c'])
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

const TypedInput = defineComponent({
  name: 'TypedInput',
  props: { maxLength: Number, placeholder: String },
  setup: () => () => <input />,
})

const TypedArray = defineComponent({
  name: 'TypedArray',
  props: { maxItems: Number },
  setup: () => () => <div />,
})

const TypedLayout = defineComponent({
  name: 'TypedLayout',
  props: { colon: Boolean },
  setup: () => () => <div />,
})

const demoComponents = {
  Input: TypedInput,
}

describe('createSchemaField 返回 SchemaField + fragment', () => {
  test('运行时：工厂返回 { SchemaField, fragment } 双 key', () => {
    const built = createSchemaField({ components: { Input: TypedInput } })

    expect(Object.keys(built).sort()).toEqual(['SchemaField', 'fragment'])
    expect(built.SchemaField).toBeTruthy()
    expect(typeof built.fragment.Field).toBe('function')
  })

  test('运行时：分类入参传组件 map，动态构造器按分类产出节点', () => {
    const { fragment: f } = createSchemaField({
      components: { Input: TypedInput },
      voidComponents: { Layout: TypedLayout },
      arrayComponents: { ArrayList: TypedArray },
      defaultDecorator: 'Layout',
    })

    expect(f.Field()()).toMatchObject({ type: 'string' })
    expect(f.Input({ title: '姓名' })()).toMatchObject({
      type: 'string',
      component: 'Input',
      title: '姓名',
      decorator: 'Layout',
    })
    expect(f.ArrayList(f.Input())()).toMatchObject({
      type: 'array',
      component: 'ArrayList',
      items: { type: 'string', component: 'Input' },
    })
    expect(f.Layout({})()).toMatchObject({ type: 'void', component: 'Layout' })
    expect(
      f.Object({
        name: f.Input({ required: true }),
      })()
    ).toMatchObject({ type: 'object', properties: { name: { type: 'string', component: 'Input' } } })
  })

  test('运行时：预绑定 SchemaField 无需再传 components 即可渲染 fragment 产出的 schema', () => {
    const { SchemaField: BoundSchemaField, fragment: f } = createSchemaField({
      components: { Input: TypedInput },
      arrayComponents: { ArrayList: TypedArray },
    })
    const schema = f.Object({ name: f.Input({ required: true }) })()
    const form = createForm()

    const wrapper = mountWithForm(form, () => <BoundSchemaField schema={schema} />)

    expect(wrapper.find('input').exists()).toBe(true)
    expect(form.fields['name']).toBeTruthy()
  })

  test('运行时：预绑定 SchemaField 支持 props 传扁平 map 覆盖同名组件', () => {
    const OverrideInput = defineComponent({
      name: 'OverrideInput',
      props: ['value'],
      setup: () => () => <input class="override-input" />,
    })
    const { SchemaField: BoundSchemaField, fragment: f } = createSchemaField({
      components: { Input: TypedInput },
    })
    const schema = f.Object({ name: f.Input() })()
    const form = createForm()

    const wrapper = mountWithForm(form, () => (
      <BoundSchemaField schema={schema} components={{ Input: OverrideInput }} />
    ))

    expect(wrapper.find('.override-input').exists()).toBe(true)
  })

  test('运行时：无参调用仍可用，动态构造器运行时保持宽松', () => {
    const { fragment: f } = createSchemaField()
    expect(f.Field()()).toMatchObject({ type: 'string' })
    expect((f as any).Anything()()).toMatchObject({ type: 'string', component: 'Anything' })
  })

  test('类型：组件 props、父子值类型与 scope 全部由扁平 components 推断，无需手写泛型', () => {
    const { fragment: f } = createSchemaField({
      components: demoComponents,
      voidComponents: { Layout: TypedLayout },
      arrayComponents: { ArrayList: TypedArray },
      scope: { $moment: (value: string) => value },
    })

    // @ts-expect-error 分类入参只接收组件 map，不再接收名字数组
    createSchemaField({ components: demoComponents, arrayComponents: ['ArrayList'] })

    f.Input({ componentProps: { maxLength: 10, placeholder: 'name' } })
    // @ts-expect-error componentProps 由组件 props 推导，maxLength 必须是 number
    f.Input({ componentProps: { maxLength: '10' } })
    // @ts-expect-error 未在 components 中声明的组件名不在类型表面
    void f.NotExist

    f.Object<{ name: string; age: number }>({
      name: f.Field({
        required: true,
        reactions: (field, scope) => {
          expectTypeOf(field.value).toEqualTypeOf<string>()
          expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
          expectTypeOf(scope.$record).toEqualTypeOf<{ name: string; age: number } & { $lookup: any; $index: number }>()
        },
      }),
      age: f.Field({
        required: true,
        reactions: field => {
          expectTypeOf(field.value).toEqualTypeOf<number>()
        },
      }),
      layout: f.Layout({}),
    })

    // @ts-expect-error 未在父级 record 中声明的 key 不允许产生值的字段，错误落在调用表达式上
    f.Object<{ name: string }>({
      name: f.Field({ required: true }),
      extra: f.Field(),
    })

    f.ArrayList(
      f.Object<{ name: string }>({
        name: f.Field({
          required: true,
          reactions: (_field, scope) => {
            expectTypeOf(scope.$record).toEqualTypeOf<{ name: string } & { $lookup: any; $index: number }>()
          },
        }),
      }),
      {
        reactions: (field, scope) => {
          expectTypeOf(field.value).toEqualTypeOf<{ name: string }[]>()
          expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
        },
      }
    )
  })

  test('类型：defaultDecorator 推断后收窄 decoratorProps', () => {
    const { fragment: f } = createSchemaField({
      components: { Input: TypedInput },
      voidComponents: { Layout: TypedLayout },
      defaultDecorator: 'Layout',
    })

    f.Input({ title: '姓名', decoratorProps: { colon: true } })
    // @ts-expect-error decoratorProps 按 Layout 的 props 推导
    f.Input({ title: '姓名', decoratorProps: { unknown: 1 } })
  })
})
