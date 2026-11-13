<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  required?: boolean
  errors?: string[]
}>()
</script>

<template>
  <div class="demo-field">
    <span class="demo-field__label">
      {{ title }}
      <em v-if="required" class="demo-field__required">*</em>
    </span>
    <span class="demo-field__control">
      <slot />
      <span v-if="description" class="demo-field__description">{{ description }}</span>
      <span v-for="error in errors ?? []" :key="error" class="demo-field__error">{{ error }}</span>
    </span>
  </div>
</template>
