<script setup lang="ts">
import { computed } from 'vue'

// defineModel 展开为 modelValue prop + update:modelValue emit，与适配层的 v-model 契约一致
const modelRef = defineModel<any>()

const props = defineProps<{
  type?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// 原生 input 直接 v-model：IME 拼字等边界交给 vModelText 指令，这里只保留类型转换
const value = computed({
  get: () => modelRef.value ?? '',
  set: next => {
    modelRef.value = props.type === 'number' ? (next === '' ? undefined : Number(next)) : next
  },
})
</script>

<template>
  <input
    v-model="value"
    class="dv-input"
    :type="type ?? 'text'"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readOnly"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
