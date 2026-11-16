import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { memo } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { FormProvider, ReactiveField, SchemaField, connect, createForm, mapProps, mapReadPretty } from '..'
import { Container, Decorator, Input, mountWithForm } from './shared'

afterEach(cleanup)

function Text(props: any) {
  return (
    <span className="text" data-value={props.value} data-text={props.text}>
      {props.title ?? props.value}
    </span>
  )
}
Text.displayName = 'Text'

function ReadPretty() {
  return <span className="read-pretty">readPretty</span>
}

function SlotViewer(props: any) {
  return (
    <div className="slot-viewer">
      <div className="named">{props.slots?.label}</div>
      <div className="default">{props.slots?.default}</div>
    </div>
  )
}
SlotViewer.displayName = 'SlotViewer'

const components = { Input, Decorator, Container, SlotViewer }

describe('schema 驱动的字段渲染', () => {
  test('数据字段基础渲染：decorator + component', () => {
    const form = createForm({ values: { username: 'init' } })
    const view = mountWithForm(
      form,
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
    )

    expect(view.container.querySelector('.decorator')).toBeTruthy()
    expect(view.container.querySelector('input')!.value).toBe('init')
    // 无名 object 根节点用 display: contents 包裹子节点
    expect(view.container.innerHTML).toContain('display: contents')
  })

  test('component / decorator 支持字符串解析与组件对象', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
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
    )

    expect(view.container.querySelectorAll('.decorator')).toHaveLength(2)
    expect(view.container.querySelectorAll('input')).toHaveLength(2)
  })

  test('无 decorator 只渲染 component；无 component 时渲染 content', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
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
    )

    expect(view.container.querySelector('.decorator')).toBeNull()
    expect(view.container.querySelector('input')).toBeTruthy()
    expect(view.container.querySelector('.slot-viewer .default')!.textContent).toBe('hello')
  })

  test('object / array / void 节点的插槽透传', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
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
    )

    const containers = view.container.querySelectorAll('.container')
    expect(containers).toHaveLength(3)
    expect(containers[0].querySelector('input')).toBeTruthy()
    expect(containers[2].querySelector('input')).toBeTruthy()
    expect((form.fields['list'] as any).displayName).toBe('ArrayField')
  })

  test('value 受控：字段值与输入事件双向同步', async () => {
    const form = createForm<{ username?: string }>({ values: { username: 'init' } })
    const view = mountWithForm(
      form,
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: { type: 'string', component: 'Input' },
          },
        }}
      />
    )

    const input = view.container.querySelector('input')!
    expect(input.value).toBe('init')

    fireEvent.change(input, { target: { value: 'changed' } })
    expect(form.values.username).toBe('changed')

    await act(async () => {
      form.setValuesIn('username', 'remote')
    })
    expect(input.value).toBe('remote')
  })

  test('componentProps 中 onChange / @change 都驱动字段，@change 优先', () => {
    const onChange = vi.fn()
    const atChange = vi.fn()
    const form = createForm<{ username?: string; nickname?: string }>()
    const view = mountWithForm(
      form,
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: {
              type: 'string',
              component: 'Input',
              componentProps: { onChange },
            },
            nickname: {
              type: 'string',
              component: 'Input',
              componentProps: { onChange, '@change': atChange },
            },
          },
        }}
      />
    )

    const inputs = view.container.querySelectorAll('input')
    fireEvent.change(inputs[0], { target: { value: 'a' } })
    expect(form.values.username).toBe('a')
    expect(onChange).toHaveBeenCalled()

    fireEvent.change(inputs[1], { target: { value: 'b' } })
    expect(form.values.nickname).toBe('b')
    expect(atChange).toHaveBeenCalled()
  })

  test('onFocus / onBlur 触发字段 focus / blur', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: { type: 'string', component: 'Input' },
          },
        }}
      />
    )

    const field = form.fields['username'] as any
    const input = view.container.querySelector('input')!
    fireEvent.focus(input)
    expect(field.active).toBe(true)

    fireEvent.blur(input)
    expect(field.active).toBe(false)
  })

  test('pattern 驱动 disabled / readOnly', async () => {
    const form = createForm()
    const view = mountWithForm(
      form,
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: { type: 'string', component: 'Input' },
          },
        }}
      />
    )

    const input = view.container.querySelector('input')!

    await act(async () => {
      form.setPattern('disabled')
    })
    expect(input.hasAttribute('disabled')).toBe(true)

    await act(async () => {
      form.setPattern('readOnly')
    })
    expect(input.hasAttribute('readonly')).toBe(true)
    expect(input.hasAttribute('disabled')).toBe(false)

    await act(async () => {
      form.setPattern('readPretty')
    })
    expect(input.hasAttribute('disabled')).toBe(true)
  })

  test('display 从 none 切到 visible 时重新渲染', async () => {
    const form = createForm()
    const view = mountWithForm(
      form,
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            username: { type: 'string', component: 'Input', display: 'none' },
          },
        }}
      />
    )

    expect(view.container.querySelector('input')).toBeNull()

    await act(async () => {
      form.setFieldState('username', state => {
        state.display = 'visible'
      })
    })
    expect(view.container.querySelector('input')).toBeTruthy()
  })

  test('content 支持字符串、具名插槽对象、ReactElement', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
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
              content: <span className="vnode-content">V</span>,
            },
          },
        }}
      />
    )

    const viewers = view.container.querySelectorAll('.slot-viewer')
    expect(viewers[0].querySelector('.default')!.textContent).toBe('plain')
    expect(viewers[1].querySelector('.named')!.textContent).toBe('LBL')
    expect(viewers[1].querySelector('.default')!.textContent).toBe('DEF')
    expect(viewers[2].querySelector('.vnode-content')!.textContent).toBe('V')
  })

  test('connect + mapProps（含 value 删除分支）与 mapReadPretty', async () => {
    const Connected = connect(Text, mapProps({ value: 'value', title: 'title' }), mapReadPretty(ReadPretty))
    const ValueMapped = connect(Text, mapProps({ value: 'text' }))

    const form = createForm({ values: { mapped: 'mapped-value' } })
    const view = mountWithForm(
      form,
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
    )

    const mapped = view.container.querySelector('.text')!
    expect(mapped.textContent).toBe('Title')
    expect(mapped.getAttribute('data-value')).toBe('mapped-value')

    await act(async () => {
      form.setPattern('readPretty')
    })
    expect(view.container.querySelector('.read-pretty')).toBeTruthy()

    await act(async () => {
      form.setPattern('editable')
    })
    const valueMapped = Array.from(view.container.querySelectorAll('.text')).at(-1)!
    expect(valueMapped.getAttribute('data-text')).toBeNull()
    expect(valueMapped.getAttribute('data-value')).toBeNull()
  })

  test('schema 变化后创建新字段并卸载旧字段', async () => {
    const form = createForm()
    let schema: any = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input' },
      },
    }
    const view = mountWithForm(form, <SchemaField components={components} schema={schema} />)

    const first = form.fields['a'] as any
    expect(first.mounted).toBe(true)

    schema = {
      type: 'object',
      properties: {
        b: { type: 'string', component: 'Input' },
      },
    }
    view.rerender(
      <FormProvider form={form}>
        <SchemaField components={components} schema={schema} />
      </FormProvider>
    )

    expect(first.unmounted).toBe(true)
    expect((form.fields['b'] as any)?.displayName).toBe('Field')
    expect(view.container.querySelector('input')!.getAttribute('data-testid')).toBe('b')
  })
})

describe('边界与降级渲染', () => {
  test('content 的空值与数字内容不渲染', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
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
    )

    const viewers = view.container.querySelectorAll('.slot-viewer')
    expect(viewers[0].querySelector('.named')!.textContent).toBe('')
    expect(viewers[0].querySelector('.default')!.textContent).toBe('5')
    expect(viewers[1].querySelector('.default')!.textContent).toBe('')
  })

  test('ReactiveField content 支持函数组件与对象组件', async () => {
    const FnContent = () => <span className="direct-fn">fn</span>
    const ObjectContent = memo(() => <span className="direct-object">object</span>)
    const Viewer = (props: any) => <div className="direct-viewer">{props.children}</div>
    const form = createForm()
    const view = render(
      <FormProvider form={form}>
        <ReactiveField fieldProps={{ name: 'directContent' }} />
      </FormProvider>
    )

    const field = form.fields['directContent'] as any
    await act(async () => {
      field.component = Viewer
      field.content = FnContent
    })
    expect(view.container.querySelector('.direct-viewer .direct-fn')!.textContent).toBe('fn')

    await act(async () => {
      field.content = ObjectContent
    })
    expect(view.container.querySelector('.direct-viewer .direct-object')!.textContent).toBe('object')
  })

  test('object 无 component / decorator 且多子节点时以 Fragment 渲染', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
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
    )

    expect(view.container.querySelectorAll('input')).toHaveLength(2)
    expect((form.fields['obj'] as any).displayName).toBe('ObjectField')
  })

  test('object 无子属性时不渲染内容', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
      <SchemaField components={components} schema={{ type: 'object', properties: { blank: { type: 'object' } } }} />
    )

    expect(view.container.querySelector('input')).toBeNull()
    expect((form.fields['blank'] as any).displayName).toBe('ObjectField')
  })

  test('object 无子属性且 content 默认插槽为空时渲染为空', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            blank: { type: 'object', content: { default: [] } as any },
          },
        }}
      />
    )

    expect(view.container.querySelector('input')).toBeNull()
    expect(view.container.querySelector('.slot-viewer')).toBeNull()
  })

  test('未注册的组件名按原生标签渲染', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            native: { type: 'string', component: 'section', content: 'native-text' },
          },
        }}
      />
    )

    expect(view.container.querySelector('section')!.textContent).toBe('native-text')
  })

  test('object 同时配置 content 与子属性时合并插槽内容', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
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
    )

    expect(view.container.querySelector('.container input')).toBeTruthy()
    expect(view.container.querySelector('.container')!.textContent).toContain('extra')
  })

  test('decoratorProps / componentProps 被清空后仍可渲染', async () => {
    const form = createForm()
    const view = mountWithForm(
      form,
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
    )

    expect(view.container.querySelector('input')!.getAttribute('placeholder')).toBe('P')

    const field = form.fields['a'] as any
    await act(async () => {
      field.decoratorProps = undefined
      field.componentProps = undefined
    })

    expect(view.container.querySelector('.decorator')).toBeTruthy()
    expect(view.container.querySelector('input')).toBeTruthy()
    expect(view.container.querySelector('input')!.getAttribute('placeholder')).toBeNull()
  })

  test('void 字段的 component 事件不写入字段状态', () => {
    const onChange = vi.fn()
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    const form = createForm()
    const view = mountWithForm(
      form,
      <SchemaField
        components={components}
        schema={{
          type: 'object',
          properties: {
            v: {
              type: 'void',
              component: 'Input',
              componentProps: { onChange, onFocus, onBlur },
            },
          },
        }}
      />
    )

    const input = view.container.querySelector('input')!
    fireEvent.change(input, { target: { value: 'x' } })
    fireEvent.focus(input)
    fireEvent.blur(input)

    expect(onChange).toHaveBeenCalled()
    expect(onFocus).toHaveBeenCalled()
    expect(onBlur).toHaveBeenCalled()

    const field = form.fields['v'] as any
    expect(field.displayName).toBe('VoidField')
    expect(field.value).toBeUndefined()
  })

  test('同名字段 schema 更新时触发字段重建逻辑', () => {
    const form = createForm()
    let schema: any = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input' },
      },
    }
    const view = mountWithForm(form, <SchemaField components={components} schema={schema} />)
    const first = form.fields['a']

    schema = {
      type: 'object',
      properties: {
        a: { type: 'string', component: 'Input', title: 'updated' },
      },
    }
    view.rerender(
      <FormProvider form={form}>
        <SchemaField components={components} schema={schema} />
      </FormProvider>
    )

    expect(form.fields['a']).toBe(first)
    expect(view.container.querySelector('input')).toBeTruthy()
  })

  test('ReactiveField 无表单上下文或字段缺失时回退渲染插槽', () => {
    const bare = render(<ReactiveField />)
    expect(bare.container.querySelectorAll('.fallback')).toHaveLength(0)

    const fallback = render(
      <ReactiveField>
        <span className="fallback">fallback</span>
      </ReactiveField>
    )
    expect(fallback.container.querySelector('.fallback')).toBeTruthy()

    const form = createForm()
    render(
      <FormProvider form={form}>
        <ReactiveField fieldType={null as any} fieldProps={null as any} />
      </FormProvider>
    )
    expect(Object.keys(form.fields)).toHaveLength(0)
  })

  test('connect / mapProps 支持函数映射、非字符串映射与匿名组件', () => {
    const Anon = (props: any) => <span className="anon">{`${props.title ?? ''}|${props.placeholder ?? ''}`}</span>
    const FnMapped = connect(
      Anon,
      mapProps((props: any) => ({ ...props, title: 'fn-title' }))
    )
    const SkipMapped = connect(Anon, mapProps({ placeholder: 'placeholder' }))
    const BoolMapped = connect(Anon, mapProps({ title: false } as any))
    // 匿名组件的 mapReadPretty 使用降级组件名
    connect(
      Anon,
      mapReadPretty(() => <span className="read-anon">read</span>)
    )

    const form = createForm()
    const view = mountWithForm(
      form,
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
    )

    const anons = view.container.querySelectorAll('.anon')
    expect(anons[0].textContent).toBe('fn-title|')
    expect(anons[1].textContent).toBe('|from-schema')
    expect(anons[2].textContent).toBe('title-value|')

    const DirectConnected = connect(Anon, mapProps({ title: 'title' }))
    const direct = render(<DirectConnected title="direct-title" />)
    expect(direct.container.querySelector('.anon')!.textContent).toBe('direct-title|')
  })
})
