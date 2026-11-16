import { reactive, shallowRef } from '@formvk/reactive'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef, useState } from 'react'
import type React from 'react'
import { afterEach, expect, test, vi } from 'vitest'

import { Observer, observer } from '../observer'

afterEach(cleanup)

test('observer 包裹的组件随响应式数据自动刷新', () => {
  const state = reactive({ count: 0 })
  const Counter = observer(() => <div>计数：{state.count}</div>)

  render(<Counter />)
  expect(screen.getByText('计数：0')).toBeTruthy()

  act(() => {
    state.count = 1
  })
  expect(screen.getByText('计数：1')).toBeTruthy()
})

test('observer 自带 memo：props 不变时父组件重渲染不带动子组件', () => {
  const childRenderCount = vi.fn()
  const Child = observer((props: { label: string }) => {
    childRenderCount()
    return <div>{props.label}</div>
  })

  function Parent() {
    const [tick, setTick] = useState(0)
    return (
      <div>
        <button onClick={() => setTick(v => v + 1)}>刷新父组件{tick}</button>
        <Child label="固定文案" />
      </div>
    )
  }

  render(<Parent />)
  expect(childRenderCount).toHaveBeenCalledTimes(1)

  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('刷新父组件1')).toBeTruthy()
  expect(childRenderCount).toHaveBeenCalledTimes(1)
})

test('observer 的 props 变化时正常刷新', () => {
  const Child = observer((props: { label: string }) => <div>{props.label}</div>)
  function Parent() {
    const [label, setLabel] = useState('旧文案')
    return (
      <div>
        <button onClick={() => setLabel('新文案')}>换文案</button>
        <Child label={label} />
      </div>
    )
  }

  render(<Parent />)
  expect(screen.getByText('旧文案')).toBeTruthy()
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('新文案')).toBeTruthy()
})

test('observer forwardRef 选项透传 ref', () => {
  const Input = observer(
    (props: { value: string; ref?: React.Ref<HTMLInputElement> }) => (
      <input ref={props.ref} value={props.value} readOnly />
    ),
    { forwardRef: true }
  )

  const inputRef = createRef<HTMLInputElement>()
  render(<Input value="hello" ref={inputRef} />)
  expect(inputRef.current).toBeInstanceOf(HTMLInputElement)
  expect(inputRef.current?.value).toBe('hello')
})

test('observer 支持 displayName 并提升组件静态属性', () => {
  const Card = observer((props: { title: string }) => <div>{props.title}</div>, {
    displayName: 'ObservedCard',
  })
  expect(Card.displayName).toBe('ObservedCard')

  const WithStatic = observer((props: { name: string }) => <div>{props.name}</div>)
  ;(WithStatic as any).staticFlag = 'static-value'
  expect((WithStatic as any).staticFlag).toBe('static-value')
})

test('Observer 组件以 render-prop 形式响应数据变化', () => {
  const state = reactive({ count: 0 })

  render(<Observer>{() => <div>render-prop：{state.count}</div>}</Observer>)
  expect(screen.getByText('render-prop：0')).toBeTruthy()

  act(() => {
    state.count = 1
  })
  expect(screen.getByText('render-prop：1')).toBeTruthy()
})

test('Observer 组件支持直接传入 ReactNode 子元素', () => {
  render(
    <Observer>
      <div>静态子节点</div>
    </Observer>
  )
  expect(screen.getByText('静态子节点')).toBeTruthy()
})

test('observer 与 2023-11 标准装饰器类协作', () => {
  class Store {
    @shallowRef accessor count = 0
    @shallowRef accessor name = 'formvk'
  }
  const store = new Store()
  const renderCount = vi.fn()

  const Counter = observer(() => {
    renderCount()
    return (
      <div>
        {store.name}-{store.count}
      </div>
    )
  })

  render(<Counter />)
  act(() => {
    store.count = 1
  })
  expect(screen.getByText('formvk-1')).toBeTruthy()
  expect(renderCount).toHaveBeenCalledTimes(2)
})
