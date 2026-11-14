<script setup lang="ts">
import { useField } from '@formvk/vue'

const field = useField()
</script>

<template>
  <div>
    <label>{{ field?.title }}</label>
    <input :value="field?.value" @input="field?.onInput($event)" />
    <span v-if="field?.selfErrors?.length">{{ field.selfErrors[0] }}</span>
  </div>
</template>
