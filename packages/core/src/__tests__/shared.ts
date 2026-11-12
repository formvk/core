export function attach<T extends { onMount: () => void }>(target: T | undefined): T {
  target?.onMount()
  return target as T
}

export function sleep(duration = 100) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}
