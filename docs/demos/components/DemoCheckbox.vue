<script setup lang="ts">
defineProps<{
  value?: any
  disabled?: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  change: [value: boolean]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

function onChange(event: Event) {
  emit('change', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <input
    class="demo-checkbox"
    type="checkbox"
    :checked="!!value"
    :disabled="disabled || readOnly"
    @change="onChange"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
