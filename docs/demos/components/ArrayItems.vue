<script setup lang="ts">
import { RecursionField, useField, useFieldSchema } from '@formvk/vue'
import { computed } from 'vue'

const props = defineProps<{
  addText?: string
  removeText?: string
  /** 新增数组项；配合 schema 的 recordKey 生成稳定键 */
  createItem?: () => any
}>()

const field = useField<any>()
const schema = useFieldSchema()

const items = computed<any[]>(() => {
  const value = field.value?.value
  return Array.isArray(value) ? value : []
})

const itemSchema = computed(() => (schema.value as any)?.items)

// 优先使用 recordKey 生成的稳定键，删除/重排时保留行组件实例
function getItemKey(index: number): string | number {
  return field.value?.getRecordKey?.(index) ?? index
}

function add() {
  field.value?.push(props.createItem ? props.createItem() : {})
}

function remove(index: number) {
  field.value?.remove(index)
}
</script>

<template>
  <div class="dv-array">
    <div v-for="(_item, index) in items" :key="getItemKey(index)" class="dv-array__item">
      <div class="dv-array__header">
        <span>#{{ index + 1 }}</span>
        <button type="button" class="dv-btn dv-btn--danger" @click="remove(index)">
          {{ props.removeText ?? '删除' }}
        </button>
      </div>
      <RecursionField :schema="itemSchema" :name="index" />
    </div>
    <div>
      <button type="button" class="dv-btn dv-btn--ghost" @click="add">
        {{ props.addText ?? '添加一项' }}
      </button>
    </div>
  </div>
</template>
