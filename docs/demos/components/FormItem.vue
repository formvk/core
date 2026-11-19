<script setup lang="ts">
import { useField } from '@formvk/vue'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    description?: string
    required?: boolean
    errors?: string[]
  }>(),
  // Boolean props default to false in Vue; keep undefined so field state can win
  { required: undefined }
)

const field = useField()

const fieldTitle = computed(() => (field.value as any)?.title as string | undefined)
const fieldDescription = computed(() => (field.value as any)?.description as string | undefined)
const fieldRequired = computed(() => !!(field.value as any)?.required)
const fieldErrors = computed(() => ((field.value as any)?.selfErrors ?? []) as string[])
</script>

<template>
  <div class="dv-field">
    <span class="dv-field__label">
      {{ props.label ?? fieldTitle }}
      <em v-if="props.required ?? fieldRequired" class="dv-field__required">*</em>
    </span>
    <span class="dv-field__control">
      <slot />
      <span v-if="props.description ?? fieldDescription" class="dv-field__description">
        {{ props.description ?? fieldDescription }}
      </span>
      <span v-for="error in props.errors ?? fieldErrors" :key="error" class="dv-field__error">
        {{ error }}
      </span>
    </span>
  </div>
</template>
