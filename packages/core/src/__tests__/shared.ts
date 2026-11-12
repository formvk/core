export const attach = <T extends { onMount: () => void }>(target: T | undefined): T => {
  target?.onMount()
  return target as T
}

export const sleep = (duration = 100) =>
  new Promise(resolve => {
    setTimeout(resolve, duration)
  })
