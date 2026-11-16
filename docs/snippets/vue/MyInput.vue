<script setup lang="ts">
import { useField } from '@formvk/vue'

const fieldRef = useField()
</script>

<template>
  <div>
    <label>{{ fieldRef?.title }}</label>
    <input :value="fieldRef?.value ?? ''" @input="fieldRef?.onInput($event)" />
    <span v-if="fieldRef?.selfErrors?.length">{{ fieldRef.selfErrors[0] }}</span>
  </div>
</template>
