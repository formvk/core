<script setup lang="ts">
// defineModel 展开为 modelValue prop + update:modelValue emit，与适配层的 v-model 契约一致
const modelRef = defineModel<boolean>()

defineProps<{
  disabled?: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()
</script>

<template>
  <input
    v-model="modelRef"
    class="dv-checkbox"
    type="checkbox"
    :disabled="disabled || readOnly"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
