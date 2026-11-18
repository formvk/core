<script setup lang="ts">
import type { ArrayField } from '@formvk/core'
import { RecursionField, useField, useFieldSchema } from '@formvk/vue'
import { computed } from 'vue'

import DemoRowMemo from './DemoRowMemo.vue'

const field = useField<ArrayField>()
const schema = useFieldSchema()

const items = computed<any[]>(() => {
  const value = field.value?.value
  return Array.isArray(value) ? value : []
})

const itemSchema = computed(() => (schema.value as any)?.items)

// 优先使用 recordKey 生成的稳定键；未配置 recordKey 时退回下标
function getItemKey(index: number): string | number {
  return field.value?.getRecordKey(index) ?? index
}
</script>

<template>
  <div class="dv-perf-array">
    <div v-for="(item, index) in items" :key="getItemKey(index)" class="dv-perf-array__row">
      <!-- 位置与数据 id 一起显示：删除首行后可以直观看出内部状态挂在哪份数据上 -->
      <span class="dv-perf-array__index">#{{ index }} · {{ item?.id }}</span>
      <!-- 纯内部状态控件，不写回表单；用来观察组件实例是否随数据行移动 -->
      <DemoRowMemo :seed="String(item?.id ?? '')" />
      <RecursionField :schema="itemSchema" :name="index" />
    </div>
  </div>
</template>
