import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.resetModules()
})

test('原生 FinalizationRegistry 可用时走原生注册与注销', async () => {
  vi.resetModules()
  const registerSpy = vi.spyOn(FinalizationRegistry.prototype, 'register')
  const unregisterSpy = vi.spyOn(FinalizationRegistry.prototype, 'unregister')
  const { trackerRegistry } = await import('../hooks/trackerRegistry')

  const target = {}
  const token = {}
  const dispose = vi.fn()
  trackerRegistry.register(target, dispose, token)
  expect(registerSpy).toHaveBeenCalledWith(target, dispose, token)

  trackerRegistry.unregister(token)
  expect(unregisterSpy).toHaveBeenCalledWith(token)

  registerSpy.mockRestore()
  unregisterSpy.mockRestore()
})

test('无原生 FinalizationRegistry 时退化为定时器，到期执行 dispose', async () => {
  vi.stubGlobal('FinalizationRegistry', undefined)
  vi.resetModules()
  vi.useFakeTimers()
  const { trackerRegistry } = await import('../hooks/trackerRegistry')

  const dispose = vi.fn()
  const token = {}
  trackerRegistry.register({}, dispose, token)

  vi.advanceTimersByTime(9999)
  expect(dispose).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(dispose).toHaveBeenCalledTimes(1)
})

test('定时器兜底在 unregister 后取消，不再执行 dispose', async () => {
  vi.stubGlobal('FinalizationRegistry', undefined)
  vi.resetModules()
  vi.useFakeTimers()
  const { trackerRegistry } = await import('../hooks/trackerRegistry')

  const dispose = vi.fn()
  const token = {}
  trackerRegistry.register({}, dispose, token)
  trackerRegistry.unregister(token)

  vi.advanceTimersByTime(10000)
  expect(dispose).not.toHaveBeenCalled()
})

test('同一 token 重复注册会先清理上一次的定时器', async () => {
  vi.stubGlobal('FinalizationRegistry', undefined)
  vi.resetModules()
  vi.useFakeTimers()
  const { trackerRegistry } = await import('../hooks/trackerRegistry')

  const first = vi.fn()
  const second = vi.fn()
  const token = {}
  trackerRegistry.register({}, first, token)
  trackerRegistry.register({}, second, token)

  vi.advanceTimersByTime(10000)
  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledTimes(1)
})
