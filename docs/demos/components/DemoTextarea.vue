<script setup lang="ts">
defineProps<{
  value?: any
  placeholder?: string
  rows?: number
  disabled?: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  change: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

function onInput(event: Event) {
  emit('change', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    class="dv-textarea"
    :value="value ?? ''"
    :rows="rows ?? 3"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readOnly"
    @input="onInput"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
