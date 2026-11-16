<script setup lang="ts">
import { useForm } from '@formvk/vue'

// Rendered inside <FormProvider> but outside <SchemaField>:
// a footer toolbar that reads and drives the same form model.
const form = useForm()
</script>

<template>
  <div class="toolbar">
    <button type="button" :disabled="form?.submitting" @click="form?.submit()">Create team</button>
    <button type="button" @click="form?.validate('members.*.email')">Validate invites only</button>
  </div>
</template>
