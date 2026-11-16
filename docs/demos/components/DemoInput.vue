<script setup lang="ts">
const props = defineProps<{
  value?: any
  type?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  change: [value: any]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  emit('change', props.type === 'number' ? (raw === '' ? undefined : Number(raw)) : raw)
}
</script>

<template>
  <input
    class="demo-input"
    :type="type ?? 'text'"
    :value="value ?? ''"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readOnly"
    @input="onInput"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
