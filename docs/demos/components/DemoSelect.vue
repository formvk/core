<script setup lang="ts">
import { computed } from 'vue'

import FieldWrapper from './FieldWrapper.vue'
import { useDemoField } from './useDemoField'

interface Option {
  label: string
  value: any
}

const props = defineProps<{
  value?: any
  options?: Option[]
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  change: [value: any]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const { field, title, description, required, errors } = useDemoField()

function normalize(source: any): Option[] {
  if (!Array.isArray(source)) return []
  return source.map((item: any) => {
    if (item && typeof item === 'object') {
      return {
        label: String(item.label ?? item.title ?? item.value ?? item.key ?? ''),
        value: item.value ?? item.key,
      }
    }
    return { label: String(item), value: item }
  })
}

const resolvedOptions = computed<Option[]>(() => {
  if (props.options?.length) return props.options
  return normalize((field.value as any)?.dataSource)
})

function onChange(event: Event) {
  emit('change', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <FieldWrapper :title="title" :description="description" :required="required" :errors="errors">
    <select
      class="demo-select"
      :value="value ?? ''"
      :disabled="disabled"
      @change="onChange"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    >
      <option value="" disabled>{{ placeholder ?? 'Select an option' }}</option>
      <option v-for="option in resolvedOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </FieldWrapper>
</template>
