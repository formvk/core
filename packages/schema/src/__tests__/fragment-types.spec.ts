import type { Field, Form } from '@formvk/core'
import { describe, expectTypeOf, test } from 'vitest'

import { createSchema } from '../create-schema'
import { createFragment } from '../fragment'
import type { SchemaCreator } from '../fragment-types'
import type { ExpressionProps, ISchema, SchemaExpression, SchemaReaction, Stringify, TScope } from '../types'

declare module '../types' {
  interface IScopeContext {
    $globalScope?: { locale: string }
  }
}

/** 组件 map 的取值是组件类型，props 由 fragment 层从组件类型中提取。 */
type StubComponent<Props> = (props: Props) => any

interface FieldMap {
  Input: StubComponent<{ maxLength?: number }>
  Select: StubComponent<{ options?: Array<{ label: string; value: any }> }>
}
interface VoidMap {
  FormItem: StubComponent<{ label?: string }>
  FormLayout: StubComponent<{ colon?: boolean }>
}
interface ArrayMap {
  ArrayItems: StubComponent<{ maxItems?: number }>
}

const f = createFragment<FieldMap, VoidMap, ArrayMap>()

describe('fragment types', () => {
  test('field creator value', () => {
    expectTypeOf(f.Field()).toEqualTypeOf<SchemaCreator<string | undefined, {}>>()
    expectTypeOf(f.Field<number>({ title: '年龄' })).toEqualTypeOf<SchemaCreator<number | undefined, {}>>()
    expectTypeOf(f.Field({ required: true })).toEqualTypeOf<SchemaCreator<string, {}>>()
    expectTypeOf(f.Field<number>({ title: '年龄', required: true })).toEqualTypeOf<SchemaCreator<number, {}>>()
  })

  test('field default drives value type', () => {
    // 无显式泛型时，Value 从 default 推断
    expectTypeOf(f.Field({ default: 0 })).toEqualTypeOf<SchemaCreator<number | undefined, {}>>()
    expectTypeOf(f.Field({ default: false })).toEqualTypeOf<SchemaCreator<boolean | undefined, {}>>()
    expectTypeOf(f.Field({ default: [''] })).toEqualTypeOf<SchemaCreator<string[] | undefined, {}>>()
    expectTypeOf(f.Field({ default: { name: '' } })).toEqualTypeOf<SchemaCreator<{ name: string } | undefined, {}>>()
    // required 收掉 undefined
    expectTypeOf(f.Field({ default: 0, required: true })).toEqualTypeOf<SchemaCreator<number, {}>>()
    // 表达式 default 放行，且不把 Value 污染成模板字面量类型
    expectTypeOf(f.Field({ default: '{{$values.x}}' })).toEqualTypeOf<SchemaCreator<string | undefined, {}>>()
    // default 必须与显式 Value 一致
    f.Field<string>({
      // @ts-expect-error default 必须与 Value 一致
      default: 0,
    })
    f.Field<boolean>({
      // @ts-expect-error default 必须与 Value 一致
      default: '',
    })
  })

  test('object / array default aligns with declared value', () => {
    interface ObjValues {
      name: string
    }
    // 显式泛型下 Value 不再参与推断，default 被严格校验
    f.Object<ObjValues>(
      { name: f.Field({ required: true }) },
      {
        default: { name: 'Alice' },
      }
    )
    f.Object<ObjValues>(
      { name: f.Field({ required: true }) },
      {
        // @ts-expect-error default 必须与对象值类型一致
        default: { name: 1 },
      }
    )
    f.Array<string>(f.Field({ required: true }), {
      default: [''],
    })
    f.Array<string>(f.Field({ required: true }), {
      // @ts-expect-error default 必须与数组值类型一致
      default: [0],
    })
  })

  test('array recordKey infers item type', () => {
    f.Array(f.Object({ name: f.Field({ required: true }) }), {
      recordKey: 'name',
    })
    f.Array(f.Object({ name: f.Field({ required: true }) }), {
      // @ts-expect-error recordKey 必须是数组项声明过的 key
      recordKey: 'missing',
    })
    f.Array(f.Object({ name: f.Field({ required: true }) }), {
      recordKey: (record, index) => {
        expectTypeOf(record).toEqualTypeOf<{ name: string }>()
        expectTypeOf(index).toEqualTypeOf<number>()
        return record.name
      },
    })
    f.Array<string>(f.Field({ required: true }), {
      // @ts-expect-error 非对象数组项只支持函数形式
      recordKey: 'length',
    })
  })

  test('field component props', () => {
    f.Field({ component: 'Input', componentProps: { maxLength: 10 } })
    f.Field({ component: 'Select', componentProps: { options: [{ label: 'a', value: 1 }] } })
    f.Input({ componentProps: { maxLength: 10 } })
    f.Input({ title: '姓名' })
    // @ts-expect-error componentProps 由组件 map 中的组件类型推导
    f.Input({ componentProps: { maxLength: '10' } })
    // @ts-expect-error componentProps 由 component 名推导
    f.Field({ component: 'Input', componentProps: { maxLength: '10' } })
    // @ts-expect-error field 的 type 固定为 string
    f.Field({ type: 'number' })
  })

  test('componentProps / decoratorProps accept expressions', () => {
    // 叶子表达式：仅 {{...}} 模板字符串放行，普通字符串仍由严格 props 拒收
    f.Input({ componentProps: { maxLength: '{{$values.limit}}' } })
    f.Field({ component: 'Input', componentProps: { maxLength: '{{$values.limit}}' } })
    // 嵌套对象/数组内的字符串叶子
    f.Field({
      component: 'Select',
      componentProps: { options: [{ label: '{{$values.optionLabel}}', value: 1 }] },
    })
    // 整个 props 直接传表达式
    f.Input({ componentProps: '{{$values.inputProps}}' })
    // decoratorProps 同理
    f.Field({ decorator: 'FormItem', decoratorProps: { label: '{{$values.title}}' } })
    f.Input({ decorator: 'FormItem', decoratorProps: '{{$values.itemProps}}' })
    // 组件/装饰器引用本身也支持表达式
    f.Field({ component: '{{$values.widget}}' })
    f.Field({ decorator: '{{$values.decorator}}' })
    // void / object / array 通道一致
    f.FormLayout({ componentProps: { colon: '{{$values.colon}}' } })
    f.Object({}, { componentProps: { colon: '{{$values.colon}}' } })
    f.ArrayItems(f.Field(), { componentProps: { maxItems: '{{$values.max}}' } })
  })

  test('state and validator keys accept expressions', () => {
    f.Field({
      readOnly: '{{x}}',
      writeOnly: '{{x}}',
      multipleOf: '{{x}}',
      maximum: '{{x}}',
      exclusiveMaximum: '{{x}}',
      minimum: '{{x}}',
      exclusiveMinimum: '{{x}}',
      maxLength: '{{x}}',
      minLength: '{{x}}',
      maxItems: '{{x}}',
      minItems: '{{x}}',
      uniqueItems: '{{x}}',
      maxProperties: '{{x}}',
      minProperties: '{{x}}',
      format: '{{x}}',
    })
    // validator：整体表达式、规则对象叶子表达式、数组混合形态
    f.Field({ validator: '{{x}}' })
    f.Field({ validator: { required: '{{x}}' } })
    f.Field({ validator: ['{{x}}', { format: 'email' }] })
    // 普通字符串/错误类型不匹配表达式模板，仍然拒收
    // @ts-expect-error readOnly 只接受 boolean 或 {{...}} 表达式
    f.Field({ readOnly: 'yes' })
    // @ts-expect-error maxLength 只接受 number 或 {{...}} 表达式
    f.Field({ maxLength: '10' })
    // @ts-expect-error format 只接受 string 或 {{...}} 表达式
    f.Field({ format: 1 })
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
        expectTypeOf(field.value).toEqualTypeOf<number | undefined>()
      },
    })
    f.Field({
      reactions: field => {
        expectTypeOf(field.value).toEqualTypeOf<string | undefined>()
      },
    })
    f.Input<number>({
      reactions: field => {
        expectTypeOf(field.value).toEqualTypeOf<number | undefined>()
      },
    })
    f.Object(
      { name: f.Field({ required: true }) },
      {
        reactions: field => {
          expectTypeOf(field.value).toEqualTypeOf<{ name: string } | undefined>()
        },
      }
    )
    f.Array(f.Object({ name: f.Field({ required: true }) }), {
      reactions: field => {
        expectTypeOf(field.value).toEqualTypeOf<{ name: string }[] | undefined>()
        expectTypeOf(field.record).toEqualTypeOf<{ name: string }>()
      },
    })
    f.ArrayItems(f.Field<number>({ required: true }), {
      reactions: field => {
        expectTypeOf(field.value).toEqualTypeOf<number[] | undefined>()
      },
    })
  })

  test('reactions infer built-in scope', () => {
    f.Field<number>({
      reactions: (field, scope) => {
        expectTypeOf(scope.$self).toEqualTypeOf(field)
        expectTypeOf(scope.$self.value).toEqualTypeOf<number | undefined>()
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
        expectTypeOf(field.value).toEqualTypeOf<number | undefined>()
        expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
        // @ts-expect-error scope 未声明的字段
        void scope.$unknown
      },
    })

    scoped.Field({
      required: true,
      reactions: (field, scope) => {
        expectTypeOf(field.value).toEqualTypeOf<string | undefined>()
        expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
      },
    })

    scoped.Array(scoped.Object({ name: scoped.Field({ required: true }) }), {
      reactions: (field, scope) => {
        expectTypeOf(field.value).toEqualTypeOf<{ name: string }[] | undefined>()
        expectTypeOf(field.record).toEqualTypeOf<{ name: string }>()
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
          expectTypeOf(field.value).toEqualTypeOf<string | undefined>()
          expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
          expectTypeOf(scope.$record).toEqualTypeOf<{ name: string; age: number } & { $lookup: any; $index: number }>()
        },
      }),
      // 不写 Field 泛型时，值类型由父级 Record 的 `age: number` 收敛
      age: scoped.Field({
        required: true,
        reactions: (field, scope) => {
          expectTypeOf(field.value).toEqualTypeOf<number | undefined>()
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
            expectTypeOf(field.value).toEqualTypeOf<string | undefined>()
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
          expectTypeOf(field.value).toEqualTypeOf<{ name: string }[] | undefined>()
          expectTypeOf(scope.$moment).toEqualTypeOf<(value: string) => string>()
        },
      }
    )

    // 父级声明后子级仍可显式覆盖 record 与 values（Component / Decorator 固定在末尾）
    scoped.Object<{ name: string }, MyScope, { name: string }>({
      name: scoped.Field<string, MyScope, { name: string }, Values, 'Input', 'FormItem'>({
        required: true,
        reactions: (field, scope) => {
          expectTypeOf(field.value).toEqualTypeOf<string | undefined>()
          expectTypeOf(scope.$values).toEqualTypeOf<Values>()
        },
      }),
    })
  })

  test('SchemaReaction accepts explicit scope generic', () => {
    type MyScope = { $locale: string }
    const reaction: SchemaReaction<Field<string>, MyScope> = (field, scope) => {
      expectTypeOf(field.value).toEqualTypeOf<string | undefined>()
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
    // 键必填，可缺省语义内嵌在值类型里（age 非 required，值含 undefined）
    expectTypeOf<(typeof result._$types$_)[0]>().toEqualTypeOf<{
      name: string
      age: number | undefined
    }>()
  })

  test('inferred object creator composes into a declared record', () => {
    // 抽取出的 creator 凭必填键 + undefined 内嵌值的聚合形状回填显式 record
    const address = f.Object({
      province: f.Field({ required: true }),
      city: f.Field(),
    })
    expectTypeOf<(typeof address._$types$_)[0]>().toEqualTypeOf<{
      province: string
      city: string | undefined
    }>()

    interface Profile {
      nickname?: string
      age?: number
    }
    interface FormValues {
      address: {
        province: string
        city?: string
      }
      profile: Profile
    }

    // 完全匹配的必填键形状可直接回填
    f.Object<FormValues>({
      address,
      // 非 required 字段聚合为 `T | undefined`，可赋给可选键目标
      profile: f.Object({
        nickname: f.Field(),
        age: f.Field<number>(),
      }),
    })

    f.Object<FormValues>({
      // @ts-expect-error 值类型与声明 record 不兼容
      address: f.Object({ province: f.Field<number>({ required: true }) }),
    })

    // void 节点不产生值，挂在未声明键上时显式声明父级 record 即可回填（与 formily-pro 用法一致）
    const section = f.Void<FormValues>({
      address,
    })
    f.Object<FormValues>({
      section,
    })
  })

  test('void creator', () => {
    const result = f.Void({
      name: f.Field({ required: true }),
    })
    expectTypeOf<(typeof result._$types$_)[0]>().toEqualTypeOf<{
      name: string
    }>()
    f.FormLayout({ componentProps: { colon: true } })
    // @ts-expect-error componentProps 由组件 map 中的组件类型推导
    f.FormLayout({ componentProps: { colon: 'true' } })
  })

  test('array creator value', () => {
    const array = f.Array(f.Field({ required: true }))
    expectTypeOf<(typeof array._$types$_)[0]>().toEqualTypeOf<string[]>()
    const arrayItems = f.ArrayItems(f.Field({ required: true }))
    expectTypeOf<(typeof arrayItems._$types$_)[0]>().toEqualTypeOf<string[]>()
    f.ArrayItems(f.Field(), { componentProps: { maxItems: 2 } })
    // @ts-expect-error componentProps 由组件 map 中的组件类型推导
    f.ArrayItems(f.Field(), { componentProps: { maxItems: '2' } })
  })

  test('void component item accepts schema directly', () => {
    f.FormItem({ title: '姓名' })
    f.FormItem({ componentProps: { label: '姓名' } })
  })

  test('strict schema properties inherit the declared record context', () => {
    interface FormValues {
      name: string
      age?: number
    }

    // 组件型 void creator：显式 IRecord 后，properties 子级拿到 record 上下文
    f.FormItem<FormValues>({
      properties: {
        name: f.Field({
          required: true,
          reactions: field => {
            expectTypeOf(field.record).toEqualTypeOf<FormValues>()
            expectTypeOf(field.value).toEqualTypeOf<string | undefined>()
          },
        }),
        age: f.Field<number>(),
      },
    })
    f.FormItem<FormValues>({
      properties: {
        // @ts-expect-error 未在 FormValues 中声明的键
        missing: f.Field(),
      },
    })

    // 基础 Void / Object 的第一个参数已经承担 properties，第二个参数不再接受它
    f.Void<FormValues>(
      {
        name: f.Field({ required: true }),
        age: f.Field<number>(),
      },
      {
        // @ts-expect-error properties 只能通过第一个参数传入
        properties: {
          name: f.Field({ required: true }),
        },
      }
    )
    f.Object<FormValues>(
      {
        name: f.Field({ required: true }),
      },
      {
        // @ts-expect-error properties 只能通过第一个参数传入
        properties: {
          name: f.Field({ required: true }),
        },
      }
    )
  })

  test('container creators accept an explicit values context', () => {
    interface FormValues {
      name: string
      age?: number
    }

    const object = f.Object<FormValues, {}, {}, FormValues>({
      name: f.Field({
        required: true,
        reactions: (field, scope) => {
          expectTypeOf(field.record).toEqualTypeOf<FormValues>()
          expectTypeOf(scope.$values).toEqualTypeOf<FormValues>()
        },
      }),
    })
    expectTypeOf<(typeof object._$types$_)[3]>().toEqualTypeOf<FormValues>()

    const voidNode = f.Void<FormValues, {}, FormValues>({
      name: f.Field({
        required: true,
        reactions: (_field, scope) => {
          expectTypeOf(scope.$values).toEqualTypeOf<FormValues>()
        },
      }),
    })
    expectTypeOf<(typeof voidNode._$types$_)[2]>().toEqualTypeOf<FormValues>()

    const array = f.Array<FormValues, {}, any, FormValues>(f.Object<FormValues>({}))
    expectTypeOf<(typeof array._$types$_)[0]>().toEqualTypeOf<FormValues[]>()
    expectTypeOf<(typeof array._$types$_)[3]>().toEqualTypeOf<FormValues>()
  })

  test('createSchema values', () => {
    const schema = createSchema({
      name: f.Field({ required: true }),
      age: f.Field<number>(),
    })
    expectTypeOf<(typeof schema._$types$_)[0]>().toEqualTypeOf<{
      name: string
      age: number | undefined
    }>()
  })

  test('createSchema injects declared values as the root record', () => {
    interface InviteValues {
      plan: string
      seats?: number
      members?: { name?: string }[]
    }

    const schema = createSchema<InviteValues>({
      plan: f.Field({
        required: true,
        reactions: field => {
          // 键的值类型从 IValues 注入到 creator 上下文
          expectTypeOf(field.value).toEqualTypeOf<string | undefined>()
        },
      }),
      // creator 不写显式值泛型，record 才能从上下文推断
      seats: f.Field({
        reactions: (field, scope) => {
          expectTypeOf(field.value).toEqualTypeOf<number | undefined>()
          // 注入 values 后，根级 creator 的 record 就是整份表单值
          expectTypeOf(field.record).toEqualTypeOf<InviteValues>()
          expectTypeOf(scope.$record).toEqualTypeOf<InviteValues & { $lookup: any; $index: number }>()
          expectTypeOf(scope.$values).toEqualTypeOf<InviteValues>()
        },
      }),
      // 对象值键交给容器 creator 自己推断 record，不被根 record 收敛
      members: f.ArrayItems(f.Object({ name: f.Input() })),
    })

    expectTypeOf<(typeof schema._$types$_)[0]>().toEqualTypeOf<InviteValues>()
  })

  test('createSchema values exclude void nodes and plain schemas', () => {
    const schema = createSchema({
      name: f.Field({ required: true }),
      layout: f.FormLayout(),
      plain: { type: 'number' },
    })
    expectTypeOf<(typeof schema._$types$_)[0]>().toEqualTypeOf<{ name: string }>()
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

  test('ExpressionProps', () => {
    // 保留原 key 的必填/可选修饰符，叶子与整体均允许表达式
    expectTypeOf<ExpressionProps<{ a: string; b?: number }>>().toEqualTypeOf<
      SchemaExpression | { a: string | SchemaExpression; b?: number | SchemaExpression }
    >()
    expectTypeOf<ExpressionProps<number>>().toEqualTypeOf<number | SchemaExpression>()
  })
})
