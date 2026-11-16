import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'

interface IRecycleTarget {
  onMount: () => void
  onUnmount: () => void
}

export function useAttach<T extends IRecycleTarget>(target: Ref<T>): Ref<T> {
  watch(target, (value, oldValue, onInvalidate) => {
    if (value && value !== oldValue) {
      oldValue?.onUnmount()
      nextTick(() => value.onMount())
      onInvalidate(() => value.onUnmount())
    }
  })
  onMounted(() => {
    target.value?.onMount()
  })
  onUnmounted(() => {
    target.value?.onUnmount()
  })
  return target
}
