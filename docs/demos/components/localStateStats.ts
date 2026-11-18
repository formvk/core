/**
 * 统计组件内部状态与当前行数据不一致的行数。
 * 每行的 Memo 输入框持有自己的内部 state，data-memo-seed 记录它挂载时对应的数据：
 * index key 下删除行后组件按下标复用，内部状态留在原位、与新的数据行错配；
 * recordKey 下组件随数据行移动，内部状态与数据保持一致。
 * 注意字段值与校验反馈属于字段实例，数组操作会重新寻址字段，不会出现这种错位。
 */
export function countMismatchedLocalState(root: ParentNode = document) {
  let count = 0
  root.querySelectorAll<HTMLInputElement>('input[data-memo-seed]').forEach(input => {
    if (input.value !== input.dataset.memoSeed) count += 1
  })
  return count
}
