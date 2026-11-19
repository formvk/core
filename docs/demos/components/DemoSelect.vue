<script setup lang="ts">
import { computed } from 'vue'

import { useDemoField } from './useDemoField'

interface Option {
  label: string
  value: any
}

const props = defineProps<{
  options?: Option[]
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// defineModel 展开为 modelValue prop + update:modelValue emit，与适配层的 v-model 契约一致
const modelRef = defineModel<any>()

const { field } = useDemoField()

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
</script>

<template>
  <select
    v-model="modelRef"
    class="dv-select"
    :disabled="disabled"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  >
    <option value="" disabled>{{ placeholder ?? '请选择' }}</option>
    <option v-for="option in resolvedOptions" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>
