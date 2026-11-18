import { afterAll, describe, expect, test } from 'vitest'
import { defineComponent, nextTick } from 'vue'

import { RecursionField, SchemaField, createForm, useField, useFieldSchema } from '..'
import { Input, mountWithForm } from './shared'

// 100 行 × 10 个输入字段 = 1000 个数据字段，外加每行的 object 字段与数组字段
const ROWS = 100
const COLS = 10
const FIELD_COUNT = ROWS * COLS

const measurements: Array<{ name: string; ms: number }> = []

function record(name: string, ms: number) {
  measurements.push({ name, ms })
}

afterAll(() => {
  const lines = measurements.map(({ name, ms }) => `  ${name}: ${ms.toFixed(1)}ms`).join('\n')
  console.log(`[perf][vue] ${ROWS} 行 × ${COLS} 列数组表单\n${lines}`)
})

function buildValues() {
  return {
    users: Array.from({ length: ROWS }, (_, row) => {
      const item: Record<string, any> = { id: `user-${row}` }
      for (let col = 0; col < COLS; col++) {
        item[`field${col}`] = `r${row}c${col}`
      }
      return item
    }),
  }
}

function buildSchema(recordKey?: string | ((record: any, index: number) => string | number)) {
  const properties: Record<string, any> = {}
  for (let col = 0; col < COLS; col++) {
    properties[`field${col}`] = { type: 'string', component: 'Input' }
  }
  return {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        component: 'ArrayList',
        ...(recordKey ? { recordKey } : {}),
        items: { type: 'object', properties },
      },
    },
  }
}

/** 数组组件：key 用索引或 recordKey，模拟真实列表渲染 */
function createArrayList(keyByRecordKey: boolean) {
  return defineComponent({
    name: keyByRecordKey ? 'ArrayListByRecordKey' : 'ArrayListByIndex',
    setup() {
      const fieldRef = useField()
      const schemaRef = useFieldSchema()
      return () => {
        const field = fieldRef.value as any
        const items = (schemaRef.value as any)?.items
        const list = Array.isArray(field?.value) ? field.value : []
        return (
          <div class="array-list">
            {list.map((_item: any, index: number) => (
              <div key={keyByRecordKey ? field.getRecordKey(index) : index} class="row">
                <RecursionField schema={items} name={index} basePath={field.address} />
              </div>
            ))}
          </div>
        )
      }
    },
  })
}

function mountBigArray(keyByRecordKey: boolean) {
  const form = createForm({ values: buildValues() })
  const ArrayList = createArrayList(keyByRecordKey)
  const start = performance.now()
  const wrapper = mountWithForm(form, () => (
    <SchemaField
      components={{ Input, ArrayList }}
      schema={buildSchema(keyByRecordKey ? (record: any) => record?.id : undefined)}
    />
  ))
  return { form, wrapper, mountMs: performance.now() - start }
}

describe('大数组表单性能（100 × 10）', () => {
  test('初始渲染与单字段更新', async () => {
    const { form, wrapper, mountMs } = mountBigArray(true)
    record('初始渲染（1000 字段）', mountMs)

    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(FIELD_COUNT)
    expect(Object.keys(form.fields).length).toBeGreaterThanOrEqual(1 + ROWS * (1 + COLS))

    const start = performance.now()
    form.setValuesIn('users.50.field5', 'changed')
    await nextTick()
    record('更新单个字段并 flush', performance.now() - start)
    expect((wrapper.findAll('input')[50 * COLS + 5].element as HTMLInputElement).value).toBe('changed')

    wrapper.unmount()
  }, 120000)

  test('删除首行：index key 与 recordKey 对比', async () => {
    for (const keyByRecordKey of [false, true]) {
      const { form, wrapper } = mountBigArray(keyByRecordKey)
      const arrayField = form.query('users').take() as any
      expect(wrapper.findAll('input')).toHaveLength(FIELD_COUNT)

      const start = performance.now()
      arrayField.remove(0)
      const modelMs = performance.now() - start
      await nextTick()
      const totalMs = performance.now() - start

      const label = keyByRecordKey ? 'recordKey' : 'index'
      record(`删除首行（${label} key）仅模型`, modelMs)
      record(`删除首行（${label} key）含渲染 flush`, totalMs)

      // index key 下 RecursionField 的 props 不变，字段重绑定由 ReactiveField 按 fields 地址键订阅兜底
      expect((form.values as any).users).toHaveLength(ROWS - 1)
      expect((form.values as any).users[0].field0).toBe('r1c0')
      expect((form.values as any).users[ROWS - 2].field9).toBe(`r${ROWS - 1}c${COLS - 1}`)

      const inputs = wrapper.findAll('input')
      expect(inputs).toHaveLength((ROWS - 1) * COLS)
      expect((inputs[0].element as HTMLInputElement).value).toBe('r1c0')
      expect((inputs[inputs.length - 1].element as HTMLInputElement).value).toBe(`r${ROWS - 1}c${COLS - 1}`)

      wrapper.unmount()
    }
  }, 120000)
})
