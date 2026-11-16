<script setup lang="ts">
import { RecursionField, useField, useFieldSchema } from '@formvk/vue'
import { computed } from 'vue'

const props = defineProps<{
  addText?: string
  removeText?: string
}>()

const field = useField<any>()
const schema = useFieldSchema()

const items = computed<any[]>(() => {
  const value = field.value?.value
  return Array.isArray(value) ? value : []
})

const itemSchema = computed(() => (schema.value as any)?.items)

function add() {
  field.value?.push({})
}

function remove(index: number) {
  field.value?.remove(index)
}
</script>

<template>
  <div class="demo-array">
    <div v-for="(_item, index) in items" :key="index" class="demo-array__item">
      <div class="demo-array__header">
        <span>#{{ index + 1 }}</span>
        <button type="button" class="demo-btn demo-btn--danger" @click="remove(index)">
          {{ props.removeText ?? 'Remove' }}
        </button>
      </div>
      <RecursionField :schema="itemSchema" :name="index" />
    </div>
    <div>
      <button type="button" class="demo-btn demo-btn--ghost" @click="add">
        {{ props.addText ?? 'Add item' }}
      </button>
    </div>
  </div>
</template>
