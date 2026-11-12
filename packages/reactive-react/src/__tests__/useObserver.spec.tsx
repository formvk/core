import { batch, reactive } from '@formvk/reactive'
import { act, cleanup, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, expect, test, vi } from 'vitest'

import { useForceUpdate } from '../hooks/useForceUpdate'
import { useObserver } from '../hooks/useObserver'

afterEach(cleanup)

test('useForceUpdate 返回稳定的刷新函数并触发重渲染', () => {
  const renderCount = vi.fn()
  let updater: () => void = () => {}

  const Component = () => {
    renderCount()
    updater = useForceUpdate()
    return <div>强制刷新</div>
  }

  render(<Component />)
  expect(renderCount).toHaveBeenCalledTimes(1)

  act(() => updater())
  expect(renderCount).toHaveBeenCalledTimes(2)
})

test('useObserver 读取的响应式数据变化时自动重渲染', () => {
  const state = reactive({ count: 0 })
  const renderCount = vi.fn()

  const Counter = () => {
    renderCount()
    return useObserver(() => <div>计数：{state.count}</div>)
  }

  render(<Counter />)
  expect(screen.getByText('计数：0')).toBeTruthy()
  expect(renderCount).toHaveBeenCalledTimes(1)

  act(() => {
    state.count = 1
  })
  expect(screen.getByText('计数：1')).toBeTruthy()
  expect(renderCount).toHaveBeenCalledTimes(2)
})

test('useObserver 只追踪 view 中实际读取的字段', () => {
  const state = reactive({ a: 1, b: 10 })
  const renderCount = vi.fn()

  const Viewer = () => {
    renderCount()
    return useObserver(() => <div>{state.a}</div>)
  }

  render(<Viewer />)
  act(() => {
    state.b = 20
  })
  expect(renderCount).toHaveBeenCalledTimes(1)

  act(() => {
    state.a = 2
  })
  expect(renderCount).toHaveBeenCalledTimes(2)
})

test('useObserver 每次渲染都会重新 track，能拿到最新 props', () => {
  const state = reactive({ suffix: '!' })

  const Viewer = (props: { prefix: string }) =>
    useObserver(() => (
      <div>
        {props.prefix}
        {state.suffix}
      </div>
    ))

  const { rerender } = render(<Viewer prefix="你好" />)
  expect(screen.getByText('你好!')).toBeTruthy()

  rerender(<Viewer prefix="再见" />)
  expect(screen.getByText('再见!')).toBeTruthy()

  act(() => {
    state.suffix = '？'
  })
  expect(screen.getByText('再见？')).toBeTruthy()
})

test('同步连续写入由 React 批处理合并为一次渲染', () => {
  const state = reactive({ count: 0 })
  const renderCount = vi.fn()

  const Counter = () => {
    renderCount()
    return useObserver(() => <div>{state.count}</div>)
  }

  render(<Counter />)
  act(() => {
    state.count = 1
    state.count = 2
    state.count = 3
  })
  expect(screen.getByText('3')).toBeTruthy()
  expect(renderCount).toHaveBeenCalledTimes(2)
})

test('batch 批次内的多次写入在批次结束后只渲染一次', () => {
  const state = reactive({ a: 0, b: 0 })
  const renderCount = vi.fn()

  const Counter = () => {
    renderCount()
    return useObserver(() => (
      <div>
        {state.a}-{state.b}
      </div>
    ))
  }

  render(<Counter />)
  act(() => {
    batch(() => {
      state.a = 1
      state.b = 1
      state.a = 2
    })
  })
  expect(screen.getByText('2-1')).toBeTruthy()
  expect(renderCount).toHaveBeenCalledTimes(2)
})

test('useObserver 支持自定义 scheduler 接管更新', () => {
  const state = reactive({ count: 0 })
  const scheduled = vi.fn((updater: () => void) => updater())
  const renderCount = vi.fn()

  const Counter = () => {
    renderCount()
    return useObserver(() => <div>{state.count}</div>, { scheduler: scheduled })
  }

  render(<Counter />)
  act(() => {
    state.count = 1
  })
  expect(scheduled).toHaveBeenCalledTimes(1)
  expect(screen.getByText('1')).toBeTruthy()
  expect(renderCount).toHaveBeenCalledTimes(2)
})

test('useObserver 组件卸载后不再响应数据变化', () => {
  const state = reactive({ count: 0 })
  const renderCount = vi.fn()

  const Counter = () => {
    renderCount()
    return useObserver(() => <div>{state.count}</div>)
  }

  const { unmount } = render(<Counter />)
  unmount()
  act(() => {
    state.count = 1
    state.count = 2
  })
  expect(renderCount).toHaveBeenCalledTimes(1)
})

test('useObserver 在 StrictMode 双挂载下行为正确且无报错', () => {
  const state = reactive({ count: 0 })

  const Counter = () => useObserver(() => <div>严格模式：{state.count}</div>)

  render(
    <StrictMode>
      <Counter />
    </StrictMode>
  )
  expect(screen.getByText('严格模式：0')).toBeTruthy()

  act(() => {
    state.count = 1
  })
  expect(screen.getByText('严格模式：1')).toBeTruthy()
})
