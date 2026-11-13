<script setup lang="ts">
import FieldWrapper from './FieldWrapper.vue'
import { useDemoField } from './useDemoField'

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

const { title, description, required, errors } = useDemoField()

function onInput(event: Event) {
  emit('change', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <FieldWrapper :title="title" :description="description" :required="required" :errors="errors">
    <textarea
      class="demo-textarea"
      :value="value ?? ''"
      :rows="rows ?? 3"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readOnly"
      @input="onInput"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />
  </FieldWrapper>
</template>
