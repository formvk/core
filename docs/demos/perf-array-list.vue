<script setup lang="ts">
import type { ArrayField } from '@formvk/core'
import { isDataField, onFieldMount } from '@formvk/core'
import type { ISchema } from '@formvk/schema'
import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/vue'
import { nextTick, reactive, ref, shallowRef } from 'vue'

import { DemoPerfRows, FormItem, demoComponents } from './components'
import { countMismatchedLocalState } from './components/localStateStats'

type Mode = 'index' | 'recordKey'
type Metric = 'validateErrors' | 'mismatched' | 'remount'

// 行级 effects：删除行时统计存活字段被重新绑定的次数，用它衡量组件与字段实例的配对是否整体换位
const lifecycle = { mounts: 0 }

const ROWS = 100
const COLS = 10
// 最后一列是 required 下拉框；每隔 3 行留空一个，制造分散的校验错误
const SELECT_COL = COLS - 1
const EMPTY_EVERY = 3

const modeOptions: Array<{ value: Mode; label: string }> = [
  { value: 'recordKey', label: 'recordKey（id）' },
  { value: 'index', label: 'index key（下标）' },
]

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { Rows: DemoPerfRows },
})

const selectOptions = ['A', 'B', 'C'].map(value => ({ label: value, value }))

let seed = 0
function buildValues() {
  return {
    users: Array.from({ length: ROWS }, (_, row) => {
      const item: Record<string, any> = { id: `user-${++seed}` }
      for (let col = 0; col < COLS; col++) {
        if (col !== SELECT_COL) {
          item[`field${col}`] = `r${row}c${col}`
        } else {
          item[`field${col}`] = row % EMPTY_EVERY === 1 ? '' : selectOptions[row % selectOptions.length].value
        }
      }
      return item
    }),
  }
}

function buildSchema(mode: Mode): ISchema {
  const properties: Record<string, any> = {
    // recordKey 必须是 items schema 里声明过的字段；hidden 只影响渲染，不影响取值
    id: f.Input({ hidden: true }),
  }
  const validator = [{ required: true, message: '必填' }]
  for (let col = 0; col < COLS; col++) {
    properties[`field${col}`] =
      col === SELECT_COL
        ? f.Field({
            component: 'Select',
            // 借用现有 FormItem 装饰器把校验错误直接显示在卡片里
            decorator: 'FormItem',
            decoratorProps: { label: 'Pick' },
            componentProps: { options: selectOptions, placeholder: '请选择' },
            validator,
          })
        : f.Input({ validator })
  }
  return createSchema({
    users: f.Rows(f.Object(properties), mode === 'recordKey' ? { recordKey: 'id' } : {}),
  })
}

function createDemoForm() {
  return createForm({
    values: buildValues(),
    effects() {
      // 行级 effects：挂载时建立订阅、卸载时清理。删除行后是否重复触发，正是两种 key 的差别
      onFieldMount('users.**', field => {
        if (isDataField(field)) lifecycle.mounts += 1
      })
    },
  })
}

const mode = ref<Mode>('recordKey')
const form = shallowRef(createDemoForm())
const schema = shallowRef<ISchema>(buildSchema('recordKey'))
// 切换模式时给 FormProvider 换 key，整棵子树重新挂载，得到一份干净的表单
const generation = ref(0)
const results = reactive<Record<Mode, Partial<Record<Metric, number>>>>({
  index: {},
  recordKey: {},
})

function rebuild(next: Mode = mode.value) {
  mode.value = next
  form.value = createDemoForm()
  schema.value = buildSchema(next)
  generation.value += 1
}

function switchMode(next: Mode) {
  if (next !== mode.value) rebuild(next)
}

async function validateAll() {
  try {
    await form.value.validate()
  } catch {
    // 校验失败会以 form.errors 抛出，这里只用于展示统计
  }
  results[mode.value].validateErrors = form.value.errors.length
}

async function removeFirst() {
  const arrayField = form.value.query('users').take() as ArrayField | undefined
  if (!arrayField) return
  lifecycle.mounts = 0
  arrayField.remove(0)
  await nextTick()
  // 字段迁移/重挂载排在下一个微任务，再等一拍取结果
  await nextTick()
  results[mode.value].remount = lifecycle.mounts
  results[mode.value].mismatched = countMismatchedLocalState()
}

function formatCount(value?: number) {
  return value === undefined ? '—' : String(value)
}
</script>

<template>
  <FormProvider :key="generation" :form="form">
    <div class="dv-demo">
      <SchemaField :schema="schema" />
      <div class="dv-perf-toolbar">
        <button
          v-for="option in modeOptions"
          :key="option.value"
          type="button"
          class="dv-btn"
          :class="{ 'dv-btn--ghost': option.value !== mode }"
          @click="switchMode(option.value)"
        >
          {{ option.label }}
        </button>
        <span class="dv-perf-hint"> {{ ROWS }} 行 × {{ COLS }} 列 · 每 {{ EMPTY_EVERY }} 行留空一个下拉框 </span>
      </div>
      <table class="dv-perf-table">
        <thead>
          <tr>
            <th>操作</th>
            <th>recordKey</th>
            <th>index key</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>校验失败数</td>
            <td>
              <strong>{{ formatCount(results.recordKey.validateErrors) }}</strong>
            </td>
            <td>{{ formatCount(results.index.validateErrors) }}</td>
          </tr>
          <tr>
            <td>内部状态错位（删首行后）</td>
            <td>
              <strong>{{ formatCount(results.recordKey.mismatched) }}</strong>
            </td>
            <td>{{ formatCount(results.index.mismatched) }}</td>
          </tr>
          <tr>
            <td>字段重新绑定（删首行）</td>
            <td>
              <strong>{{ formatCount(results.recordKey.remount) }}</strong>
            </td>
            <td>{{ formatCount(results.index.remount) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="dv-actions">
        <button type="button" class="dv-btn" @click="validateAll">校验全部</button>
        <button type="button" class="dv-btn dv-btn--danger" @click="removeFirst">删除首行</button>
        <button type="button" class="dv-btn dv-btn--ghost" @click="rebuild()">重置</button>
      </div>
      <p class="dv-perf-note">
        每 3 行留空一个下拉框。先点击「校验全部」，再点击「删除首行」：校验反馈属于字段实例，两种模式下 33
        个错误都留在空值行上，不会错位。内部状态输入框只持有组件自己的状态：index key
        下组件按下标复用，数据前移后输入内容仍停在原位，与新行数据不再匹配；recordKey
        下组件随数据行移动，内部状态与数据保持一致。「内部状态错位」统计内容与所在行数据不一致的输入框数量；「字段重新绑定」统计删除首行时存活字段被重新绑定的次数。
      </p>
    </div>
  </FormProvider>
</template>
