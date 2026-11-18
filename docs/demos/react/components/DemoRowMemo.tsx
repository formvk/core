import { useState } from 'react'

export interface DemoRowMemoProps {
  seed: string
}

/**
 * 内部状态控件：初始值来自行数据，之后完全由组件自己持有，不回写表单。
 * 用来观察 index key 按下标复用组件实例时，内部状态是否还停在原来的位置。
 */
export function DemoRowMemo(props: DemoRowMemoProps) {
  const [draft, setDraft] = useState(() => props.seed)

  return (
    <label className="dr-perf-array__memo">
      <span>内部状态</span>
      <input
        className="dr-input"
        value={draft}
        data-memo-seed={props.seed}
        onChange={event => setDraft(event.target.value)}
      />
    </label>
  )
}
