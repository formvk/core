import { autorun, batch, computed, observable } from '@formvk/reactive'
import { observer } from '@formvk/reactive-react'
import { useEffect, useState } from 'react'

const state = observable({ count: 0, step: 1 })
const doubled = computed(() => state.count * 2)

export default observer(function ReactivityDemo() {
  const [log, setLog] = useState('')

  // autorun 与框架无关：在 useEffect 中启动、卸载时清理即可
  useEffect(() => {
    const dispose = autorun(() => {
      setLog(`autorun 触发 → count = ${state.count}, doubled = ${doubled.value}`)
    })
    return () => dispose()
  }, [])

  function increment() {
    state.count += state.step
  }

  function addTwice() {
    batch(() => {
      state.count += 1
      state.count += 1
    })
  }

  function toggleStep() {
    state.step = state.step === 1 ? 5 : 1
  }

  return (
    <div className="demo">
      <p>
        count: <strong>{state.count}</strong> · step: {state.step} · doubled: <strong>{doubled.value}</strong>
      </p>
      <div className="demo-actions">
        <button type="button" className="demo-btn" onClick={increment}>
          +{state.step}
        </button>
        <button type="button" className="demo-btn demo-btn--ghost" onClick={addTwice}>
          batch +2
        </button>
        <button type="button" className="demo-btn demo-btn--ghost" onClick={toggleStep}>
          step → {state.step === 1 ? 5 : 1}
        </button>
      </div>
      <div className="demo-result">
        <pre>{log}</pre>
      </div>
    </div>
  )
})
