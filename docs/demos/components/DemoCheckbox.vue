<script setup lang="ts">
import { computed } from 'vue'

import { useDemoField } from './useDemoField'

const props = defineProps<{
  value?: any
  label?: string
  disabled?: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  change: [value: boolean]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const { title, errors } = useDemoField()

const content = computed(() => props.label ?? title.value ?? '')

function onChange(event: Event) {
  emit('change', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="demo-field">
    <span class="demo-field__label" />
    <span class="demo-field__control">
      <label class="demo-checkbox">
        <input
          type="checkbox"
          :checked="!!value"
          :disabled="disabled || readOnly"
          @change="onChange"
          @focus="emit('focus', $event)"
          @blur="emit('blur', $event)"
        />
        <span>{{ content }}</span>
      </label>
      <span v-for="error in errors ?? []" :key="error" class="demo-field__error">{{ error }}</span>
    </span>
  </div>
</template>
