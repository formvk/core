<script setup lang="ts">
import { useField } from '@formvk/vue'

// Explicit props win; the surrounding field state is the fallback
defineProps<{
  label?: string
  description?: string
  required?: boolean
  errors?: string[]
}>()

const fieldRef = useField()
</script>

<template>
  <div class="form-item">
    <label>
      {{ label ?? fieldRef?.title }}
      <em v-if="required ?? fieldRef?.required">*</em>
    </label>
    <slot />
    <span v-if="description ?? fieldRef?.description">
      {{ description ?? fieldRef?.description }}
    </span>
    <span v-for="error in errors ?? fieldRef?.selfErrors" :key="error" class="form-item-error">
      {{ error }}
    </span>
  </div>
</template>
