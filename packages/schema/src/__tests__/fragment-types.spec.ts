import type { Field, Form } from '@formvk/core'
import { describe, expectTypeOf, test } from 'vitest'

import { createSchema } from '../create-schema'
import { createFragment } from '../fragment'
import type { SchemaCreator } from '../fragment-types'
import type { ISchema, SchemaExpression, SchemaReaction, Stringify, TScope } from '../types'

declare module '../types' {
  interface IScopeContext {
    $globalScope?: { locale: string }
  }
}

interface FieldMap {
  Input: { maxLength?: number }
  Select: { options?: Array<{ label: string; value: any }> }
}
interface VoidMap {
  FormItem: { label?: string }
  FormLayout: { colon?: boolean }
}
interface ArrayMap {
  ArrayItems: { maxItems?: number }
}

const f = createFragment<FieldMap, VoidMap, ArrayMap>()

describe('fragment types', () => {
  test('field creator value', () => {
    expectTypeOf(f.Field()).toEqualTypeOf<SchemaCreator<string | undefined, {}>>()
    expectTypeOf(f.Field<number>({ title: '年龄' })).toEqualTypeOf<SchemaCreator<number | undefined, {}>>()
    expectTypeOf(f.Field({ required: true })).toEqualTypeOf<SchemaCreator<string, {}>>()
    expectTypeOf(f.Field<number>({ title: '年龄', required: true })).toEqualTypeOf<SchemaCreator<number, {}>>()
  })

  test('field component props', () => {
    f.Field({ component: 'Input', componentProps: { maxLength: 10 } })
    f.Field({ component: 'Select', componentProps: { options: [{ label: 'a', value: 1 }] } })
    f.Input({ componentProps: { maxLength: 10 } })
    f.Input({ title: '姓名' })
    // @ts-expect-error componentProps 由分类 props map 推导
    f.Input({ componentProps: { maxLength: '10' } })
    // @ts-expect-error componentProps 由 component 名推导
    f.Field({ component: 'Input', componentProps: { maxLength: '10' } })
    // @ts-expect-error field 的 type 固定为 string
    f.Field({ type: 'number' })
  })

  test('default decorator option', () => {
    createFragment<FieldMap, VoidMap, ArrayMap>({ defaultDecorator: 'FormItem' })
    // 允许未注册的组件名，运行时从 components 映射解析
    createFragment<FieldMap, VoidMap, ArrayMap>({ defaultDecorator: 'FieldWrapper' })
    // @ts-expect-error defaultDecorator 必须是组件名或组件引用
    createFragment<FieldMap, VoidMap, ArrayMap>({ defaultDecorator: 1 })
    // @ts-expect-error 第五个泛型声明后，运行时取值必须一致
    createFragment<FieldMap, VoidMap, ArrayMap, {}, 'FormItem'>({ defaultDecorator: 'FormLayout' })
  })

  test('default decorator drives decoratorProps', () => {
    const decorated = createFragment<FieldMap, VoidMap, ArrayMap, {}, 'FormItem'>({ defaultDecorator: 'FormItem' })

    decorated.Field({ title: '姓名', decoratorProps: { label: '姓名' } })
    decorated.Input({ title: '姓名', decoratorProps: { label: '姓名' } })
    decorated.Object({}, { decoratorProps: { label: '布局' } })
    decorated.Void({}, { decoratorProps: { label: '布局' } })
    decorated.Array(decorated.Field(), { decoratorProps: { label: '列表' } })
    decorated.FormLayout({ decoratorProps: { label: '布局' } })
    decorated.ArrayItems(decorated.Field(), { decoratorProps: { label: '列表' } })

    // @ts-expect-error decoratorProps 由默认装饰器推导
    decorated.Field({ title: '姓名', decoratorProps: { colon: true } })
    // @ts-expect-error decoratorProps 由默认装饰器推导
    decorated.Input({ title: '姓名', decoratorProps: { colon: true } })
    // @ts-expect-error decoratorProps 由默认装饰器推导
    decorated.Object({}, { decoratorProps: { colon: true } })
    // @ts-expect-error decoratorProps 由默认装饰器推导
    decorated.Void({}, { decoratorProps: { colon: true } })
    // @ts-expect-error decoratorProps 由默认装饰器推导
    decorated.Array(decorated.Field(), { decoratorProps: { colon: true } })
    // @ts-expect-error decoratorProps 由默认装饰器推导
    decorated.FormLayout({ decoratorProps: { colon: true } })
    // @ts-expect-error decoratorProps 由默认装饰器推导
    decorated.ArrayItems(decorated.Field(), { decoratorProps: { colon: true } })

    // 显式 decorator 仍然覆盖默认值
    decorated.Field({ title: '姓名', decorator: 'FormLayout', decoratorProps: { colon: true } })
    // @ts-expect-error decoratorProps 由显式 decorator 推导
    decorated.Field({ title: '姓名', decorator: 'FormLayout', decoratorProps: { label: '姓名' } })
  })

  test('default decorator reference drives decoratorProps', () => {
    class StubFormItem {
      $props!: { label?: string }
    }
    const decorated = createFragment<FieldMap, VoidMap, ArrayMap, {}, typeof StubFormItem>({
      defaultDecorator: StubFormItem,
    })

    decorated.Field({ title: '姓名', decoratorProps: { label: '姓名' } })
    // @ts-expect-error decoratorProps 由默认装饰器组件推导
    decorated.Field({ title: '姓名', decoratorProps: { colon: true } })
  })

  test('field decorator props', () => {
    f.Field({ component: 'Input', decorator: 'FormItem', decoratorProps: { label: '姓名' } })
    f.Input({ decorator: 'FormItem', decoratorProps: { label: '姓名' } })
    // @ts-expect-error decoratorProps 由 decorator 名推导
    f.Field({ component: 'Input', decorator: 'FormItem', decoratorProps: { colon: true } })
    // @ts-expect-error decoratorProps 由 decorator 名推导
    f.Input({ decorator: 'FormItem', decoratorProps: { colon: true } })
  })

  test('object / void / array decorator props', () => {
    f.Object({}, { decorator: 'FormItem', decoratorProps: { label: '布局' } })
    f.Void({}, { decorator: 'FormItem', decoratorProps: { label: '布局' } })
    f.Array(f.Field(), { decorator: 'FormItem', decoratorProps: { label: '列表' } })
    f.FormLayout({ decorator: 'FormItem', decoratorProps: { label: '布局' } })
    f.ArrayItems(f.Field(), { decorator: 'FormItem', decoratorProps: { label: '列表' } })
    // @ts-expect-error decoratorProps 由 decorator 名推导
    f.Object({}, { decorator: 'FormLayout', decoratorProps: { label: '布局' } })
    // @ts-expect-error decoratorProps 由 decorator 名推导
    f.Void({}, { decorator: 'FormLayout', decoratorProps: { label: '布局' } })
    // @ts-expect-error decoratorProps 由 decorator 名推导
    f.Array(f.Field(), { decorator: 'FormLayout', decoratorProps: { label: '列表' } })
    // @ts-expect-error decoratorProps 由 decorator 名推导
    f.FormLayout({ decorator: 'FormLayout', decoratorProps: { label: '布局' } })
    // @ts-expect-error decoratorProps 由 decorator 名推导
    f.ArrayItems(f.Field(), { decorator: 'FormLayout', decoratorProps: { label: '列表' } })
  })

  test('object / void / array decorator references infer props', () => {
    class StubLayout {
      $props!: { colon?: boolean }
    }
    class StubArrayItems {
      $props!: { maxItems?: number }
    }
    class StubFormItem {
      $props!: { label?: string }
    }
    const plain = createFragment()

    plain.Object({}, { component: StubLayout, decorator: StubFormItem, decoratorProps: { label: '布局' } })
    // @ts-expect-error decoratorProps 由装饰器本身的 $props 推导
    plain.Object({}, { component: StubLayout, decorator: StubFormItem, decoratorProps: { colon: true } })

    plain.Void({}, { component: StubLayout, decorator: StubFormItem, decoratorProps: { label: '布局' } })
    // @ts-expect-error decoratorProps 由装饰器本身的 $props 推导
    plain.Void({}, { component: StubLayout, decorator: StubFormItem, decoratorProps: { colon: true } })

    plain.Array(plain.Field(), {
      component: StubArrayItems,
      decorator: StubFormItem,
      decoratorProps: { label: '列表' },
    })
    plain.Array(plain.Field(), {
      component: StubArrayItems,
      decorator: StubFormItem,
      // @ts-expect-error decoratorProps 由装饰器本身的 $props 推导
      decoratorProps: { colon: true },
    })
  })

  test('object / void / array accept component references', () => {
    class StubLayout {
      $props!: { colon?: boolean }
    }
    class StubArrayItems {
      $props!: { maxItems?: number }
    }
    const plain = createFragment()

    plain.Object({}, { component: StubLayout, componentProps: { colon: true } })
    // @ts-expect-error componentProps 由组件本身的 $props 推导
    plain.Object({}, { component: StubLayout, componentProps: { colon: 'yes' } })

    plain.Void({}, { component: StubLayout, componentProps: { colon: true } })
    // @ts-expect-error componentProps 由组件本身的 $props 推导
    plain.Void({}, { component: StubLayout, componentProps: { colon: 'yes' } })

    plain.Array(plain.Field(), { component: StubArrayItems, componentProps: { maxItems: 2 } })
    // @ts-expect-error componentProps 由组件本身的 $props 推导
    plain.Array(plain.Field(), { component: StubArrayItems, componentProps: { maxItems: '2' } })
  })

  test('component references infer props without registration', () => {
    class StubInput {
      $props!: { maxLength?: number }
    }
    class StubFormItem {
      $props!: { label?: string }
    }
    class ReactInput {
      props!: { maxLength?: number }

      constructor(_props: { maxLength?: number }) {}
    }
    const plain = createFragment()

    plain.Field({ component: StubInput, componentProps: { maxLength: 10 } })
    // @ts-expect-error componentProps 由组件本身的 $props 推导
    plain.Field({ component: StubInput, componentProps: { maxLength: '10' } })

    plain.Field({ component: StubInput, decorator: StubFormItem, decoratorProps: { label: '姓名' } })
    // @ts-expect-error decoratorProps 由装饰器本身的 $props 推导
    plain.Field({ component: StubInput, decorator: StubFormItem, decoratorProps: { colon: true } })

    // React 类组件从构造函数首参推导 props
    plain.Field({ component: ReactInput, componentProps: { maxLength: 10 } })
    // @ts-expect-error componentProps 由类组件的构造函数推导
    plain.Field({ component: ReactInput, componentProps: { maxLength: '10' } })

    // 未注册时字符串组件名仍保持宽松
    plain.Field({ component: 'Anything', componentProps: { whatever: 1 } })
  })

  test('reactions infer value and record', () => {
    f.Field<number>({
      reactions: field => {
        expectTypeOf(field.value).toEqualTypeOf<number>()
      },
    })
    f.Field({
      reactions: field => {
        expectTypeOf(field.value).toEqualTypeOf<string>()
      },
    })
    f.Input<number>({
      reactions: field => {
        expectTypeOf(field.value).toEqualTypeOf<number>()
      },
    })
    f.Object(
      { name: f.Field({ required: true }) },
      {
        reactions: field => {
          expectTypeOf(field.value).toEqualTypeOf<{ name?: string }>()
        },
      }
    )
    f.Array(f.Object({ name: f.Field({ required: true }) }), {
      reactions: field => {
        expectTypeOf(field.value).toEqualTypeOf<{ name?: string }[]>()
        expectTypeOf(field.record).toEqualTypeOf<{ name?: string }>()
      },
    })
    f.ArrayItems(f.Field<number>({ required: true }), {
      reactions: field => {
        expectTypeOf(field.value).toEqualTypeOf<number[]>()
      },
    })
  })

  test('reactions infer built-in scope', () => {
    f.Field<number>({
      reactions: (field, scope) => {
        expectTypeOf(scope.$self).toEqualTypeOf(field)
        expectTypeOf(scope.$self.value).toEqualTypeOf<number>()
        expectTypeOf(scope.$index).toEqualTypeOf<number>()
        expectTypeOf(scope.$form).toEqualTypeOf<Form<any>>()
        expectTypeOf(scope.$values).toBeAny()
        expectTypeOf(scope.$record).toBeAny()
        expectTypeOf(scope.$records).toBeArray()
        expectTypeOf(scope.$memo(() => 1)).toEqualTypeOf<number>()
        expectTypeOf(scope.$observable({ count: 1 })).toEqualTypeOf<{ count: number }>()
        expectTypeOf(scope.$effect).toBeFunction()
        expectTypeOf(scope.$props).toBeFunction()
      },
    })

    f.Input({
      reactions: (field, scope) => {
        scope.$props({ maxLength: 10 })
        // @ts-expect-error $props 使用组件 props 类型
        scope.$props({ maxLength: '10' })
      },
    })
  })

  test('TScope composes built-in, global and custom scope', () => {
    interface MyScope {
      $moment: (value: string) => string
    }
    type Values = { list: { name: string }[] }
    interface RowRecord {
      name: string
    }

    const scope = Object.create(null) as TScope<MyScope, Field<string, any, any, RowRecord>, RowRecord, Values>

    expectTypeOf(scope.$self).toEqualTypeOf<Field<string, any, any, RowRecord>>()
    expectTypeOf(scope.$record).toEqualTypeOf<RowRecord & { $lookup: any; $index: number }>()
    expectTypeOf(scope.$records).toEqualTypeOf<RowRecord[]>()
    expectTypeOf(scope.$values).toEqualTypeOf<Values>()
    expectTypeOf(scope.$form).toEqualTypeOf<Form<Values>>()
    expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
    // 全局扩展
    expectTypeOf(scope.$globalScope).toEqualTypeOf<{ locale: string } | undefined>()
  })

  test('reactions scope generic', () => {
    interface MyScope {
      $moment: (value: string) => string
    }
    const scoped = createFragment<FieldMap, VoidMap, ArrayMap, MyScope>()

    scoped.Field<number>({
      reactions: (field, scope) => {
        expectTypeOf(field.value).toEqualTypeOf<number>()
        expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
        // @ts-expect-error scope 未声明的字段
        void scope.$unknown
      },
    })

    scoped.Field({
      required: true,
      reactions: (field, scope) => {
        expectTypeOf(field.value).toEqualTypeOf<string>()
        expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
      },
    })

    scoped.Array(scoped.Object({ name: scoped.Field({ required: true }) }), {
      reactions: (field, scope) => {
        expectTypeOf(field.value).toEqualTypeOf<{ name?: string }[]>()
        expectTypeOf(field.record).toEqualTypeOf<{ name?: string }>()
        expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
      },
    })

    scoped.FormLayout({
      reactions: (field, scope) => {
        expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
      },
    })
  })

  test('parent declared record and scope flow into children', () => {
    interface MyScope {
      $moment: (value: string) => string
    }
    type Values = { list: Array<{ name: string }> }
    const scoped = createFragment<FieldMap, VoidMap, ArrayMap, MyScope>()

    scoped.Object<{ name: string; age: number }, MyScope>({
      name: scoped.Field({
        required: true,
        reactions: (field, scope) => {
          expectTypeOf(field.value).toEqualTypeOf<string>()
          expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
          expectTypeOf(scope.$record).toEqualTypeOf<{ name: string; age: number } & { $lookup: any; $index: number }>()
        },
      }),
      // 不写 Field 泛型时，值类型由父级 Record 的 `age: number` 收敛
      age: scoped.Field({
        required: true,
        reactions: (field, scope) => {
          expectTypeOf(field.value).toEqualTypeOf<number>()
          expectTypeOf(scope.$record).toEqualTypeOf<{ name: string; age: number } & { $lookup: any; $index: number }>()
        },
      }),
      // 未在父级 Record 中声明的 key 只允许 void 子节点
      layout: scoped.FormLayout(),
      // @ts-expect-error 未声明的 key 不允许产生值的字段
      extra: scoped.Field(),
    })

    // 嵌套对象显式声明自身值类型即可，Scope 与父级一致时无需重复声明
    scoped.Object<{ address: { street: string } }>({
      address: scoped.Object<{ street: string }>({
        street: scoped.Field({
          required: true,
          reactions: (field, scope) => {
            expectTypeOf(field.value).toEqualTypeOf<string>()
            expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
            expectTypeOf(scope.$record).toEqualTypeOf<{ street: string } & { $lookup: any; $index: number }>()
          },
        }),
      }),
    })

    scoped.Void<{ name: string }, MyScope>({
      name: scoped.Field({
        required: true,
        reactions: (field, scope) => {
          expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
          expectTypeOf(scope.$record).toEqualTypeOf<{ name: string } & { $lookup: any; $index: number }>()
        },
      }),
      layout: scoped.FormLayout(),
    })

    scoped.Array<{ name: string }, MyScope>(
      scoped.Object<{ name: string }>({
        name: scoped.Field({
          required: true,
          reactions: (field, scope) => {
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

    // 父级声明后子级仍可显式覆盖 record 与 values
    scoped.Object<{ name: string }, MyScope, { name: string }>({
      name: scoped.Field<string, 'Input', 'FormItem', MyScope, { name: string }, Values>({
        required: true,
        reactions: (field, scope) => {
          expectTypeOf(field.value).toEqualTypeOf<string>()
          expectTypeOf(scope.$values).toEqualTypeOf<Values>()
        },
      }),
    })
  })

  test('SchemaReaction accepts explicit scope generic', () => {
    type MyScope = { $locale: string }
    const reaction: SchemaReaction<Field<string>, MyScope> = (field, scope) => {
      expectTypeOf(field.value).toEqualTypeOf<string>()
      expectTypeOf(scope.$locale).toEqualTypeOf<string>()
    }
    void reaction
  })

  test('IScopeContext can be extended globally', () => {
    f.Field({
      reactions: (field, scope) => {
        expectTypeOf(scope.$globalScope).toEqualTypeOf<{ locale: string } | undefined>()
      },
    })
  })

  test('dynamic creators require a declared component', () => {
    const plain = createFragment()
    // @ts-expect-error 未在组件映射中声明 Input 时不存在 f.Input
    plain.Input()
  })

  test('object creator value', () => {
    const result = f.Object({
      name: f.Field({ required: true }),
      age: f.Field<number>(),
    })
    expectTypeOf<(typeof result._$types$_)[0]>().toEqualTypeOf<{
      name?: string
      age?: number | undefined
    }>()
  })

  test('void creator', () => {
    const result = f.Void({
      name: f.Field({ required: true }),
    })
    expectTypeOf<(typeof result._$types$_)[0]>().toEqualTypeOf<{
      name?: string
    }>()
    f.FormLayout({ componentProps: { colon: true } })
    // @ts-expect-error componentProps 由分类 props map 推导
    f.FormLayout({ componentProps: { colon: 'true' } })
  })

  test('array creator value', () => {
    const array = f.Array(f.Field({ required: true }))
    expectTypeOf<(typeof array._$types$_)[0]>().toEqualTypeOf<string[]>()
    const arrayItems = f.ArrayItems(f.Field({ required: true }))
    expectTypeOf<(typeof arrayItems._$types$_)[0]>().toEqualTypeOf<string[]>()
    f.ArrayItems(f.Field(), { componentProps: { maxItems: 2 } })
    // @ts-expect-error componentProps 由分类 props map 推导
    f.ArrayItems(f.Field(), { componentProps: { maxItems: '2' } })
  })

  test('void component item accepts schema directly', () => {
    f.FormItem({ title: '姓名' })
    f.FormItem({ componentProps: { label: '姓名' } })
  })

  test('createSchema values', () => {
    const schema = createSchema({
      name: f.Field({ required: true }),
      age: f.Field<number>(),
    })
    expectTypeOf<(typeof schema._$types$_)[0]>().toEqualTypeOf<{
      name?: string
      age?: number | undefined
    }>()
  })

  test('ISchema can be extended', () => {
    interface MySchema extends ISchema {
      fieldWidget?: string
    }

    expectTypeOf<MySchema>().toMatchTypeOf<ISchema>()
    expectTypeOf<MySchema['visible']>().toEqualTypeOf<boolean | SchemaExpression | undefined>()
    expectTypeOf<MySchema['fieldWidget']>().toEqualTypeOf<string | undefined>()
  })

  test('Stringify', () => {
    expectTypeOf<Stringify<string>>().toEqualTypeOf<string | SchemaExpression>()
    expectTypeOf<Stringify<boolean>>().toEqualTypeOf<boolean | SchemaExpression>()
    expectTypeOf<Stringify<string[]>>().toEqualTypeOf<Array<string | SchemaExpression> | SchemaExpression>()
    expectTypeOf<Stringify<{ visible: boolean }>>().toEqualTypeOf<{
      visible?: boolean | SchemaExpression
    }>()
  })
})
