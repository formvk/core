import { describe, expect, test, vi } from 'vitest'
import { effect, effectScope, nextTick, ref } from 'vue'

describe('batch', () => {
  test('batch', async () => {
    const n = ref(0)
    const spy1 = vi.fn()

    const scope = effectScope()

    scope.run(() => {
      effect(() => {
        spy1(n.value)
      })
    })

    expect(spy1).toHaveBeenCalledTimes(1)

    await nextTick()
    scope.pause()
    n.value++
    await nextTick()
    n.value++
    scope.resume()
    expect(spy1).toHaveBeenCalledTimes(2)
    scope.stop()
  })
})
