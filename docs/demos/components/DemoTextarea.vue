<script setup lang="ts">
// defineModel 展开为 modelValue prop + update:modelValue emit，与适配层的 v-model 契约一致
const modelRef = defineModel<string>()

defineProps<{
  placeholder?: string
  rows?: number
  disabled?: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()
</script>

<template>
  <textarea
    v-model="modelRef"
    class="dv-textarea"
    :rows="rows ?? 3"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readOnly"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
