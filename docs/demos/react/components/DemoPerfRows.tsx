import type { ArrayField } from '@formvk/core'
import { RecursionField, useField, useFieldSchema } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

import { DemoRowMemo } from './DemoRowMemo'

export const DemoPerfRows = observer(() => {
  const field = useField<ArrayField>()
  const schema = useFieldSchema()

  const items = Array.isArray(field?.value) ? field.value : []
  const itemSchema = schema?.items

  return (
    <div className="dr-perf-array">
      {items.map((item, index) => (
        // 优先使用 recordKey 生成的稳定键；未配置 recordKey 时退回下标
        <div key={field?.getRecordKey(index) ?? index} className="dr-perf-array__row">
          {/* 位置与数据 id 一起显示：删除首行后可以直观看出内部状态挂在哪份数据上 */}
          <span className="dr-perf-array__index">
            #{index} · {String(item?.id ?? '')}
          </span>
          {/* 纯内部状态控件，不写回表单；用来观察组件实例是否随数据行移动 */}
          <DemoRowMemo seed={String(item?.id ?? '')} />
          {itemSchema && !Array.isArray(itemSchema) ? <RecursionField schema={itemSchema} name={index} /> : null}
        </div>
      ))}
    </div>
  )
})

DemoPerfRows.displayName = 'DemoPerfRows'
