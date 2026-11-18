<script setup lang="ts">
import { onFieldValueChange } from '@formvk/core'
import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/vue'
import { computed, ref } from 'vue'

import { DemoArrayItems, demoComponents, FormItem } from './components'

type Plan = 'free' | 'pro' | 'enterprise'

interface Member {
  name?: string
  email?: string
  role?: string
}

interface TeamInviteValues {
  teamName: string
  plan: Plan
  seats?: number
  billingEmail?: string
  members: Member[]
  inviteNow: boolean
  message?: string
}

// Members included in each plan. The same table drives validation and the
// summary line, so the business rule lives in exactly one place.
const PLAN_SEATS: Record<Plan, number> = { free: 3, pro: 20, enterprise: 100 }

// Stands in for a backend directory: the async rule below rejects these addresses.
const TAKEN_EMAILS = new Set(['taken@acme.com'])

async function ensureEmailAvailable(value: unknown) {
  await new Promise(resolve => setTimeout(resolve, 150))
  return !TAKEN_EMAILS.has(String(value)) || 'This email has already been invited'
}

const form = createForm<TeamInviteValues>({
  values: {
    teamName: '',
    plan: 'free',
    seats: 3,
    billingEmail: '',
    members: [{ name: '', email: '', role: 'member' }],
    inviteNow: true,
    message: '',
  },
  effects() {
    // Keep the list editable: removing the last row re-adds an empty one, so the
    // array component never renders a list without an entry point.
    onFieldValueChange('members', (_field, form) => {
      if (form.values.members.length === 0) {
        form.setValuesIn('members', [{}])
      }
    })
    // Cross-field rules only run when their own field is validated, so changing
    // the plan re-validates the fields whose limits depend on it.
    onFieldValueChange('plan', (_field, form) => {
      form.validate('seats')
      form.validate('members')
    })
    // A side effect on another field's value is easier to express imperatively:
    // switching invitations off drops the drafted message.
    onFieldValueChange('inviteNow', (field, form) => {
      if (!field.value) {
        form.setValuesIn('message', '')
      }
    })
  },
})

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})

const schema = createSchema<TeamInviteValues>({
  teamName: f.Input({
    title: 'Team name',
    required: true,
    validator: [
      { required: true, message: 'Team name is required' },
      { minLength: 3, message: 'Use at least 3 characters' },
      { maxLength: 30, message: 'Use at most 30 characters' },
    ],
    componentProps: { placeholder: 'Acme Design' },
  }),
  plan: f.Select({
    title: 'Plan',
    componentProps: {
      placeholder: 'Select a plan',
      options: [
        { label: 'Free · 3 members', value: 'free' },
        { label: 'Pro · 20 members', value: 'pro' },
        { label: 'Enterprise · 100 members', value: 'enterprise' },
      ],
    },
  }),
  seats: f.NumberInput({
    title: 'Seats',
    description: 'How many people can join this team',
    validator: [
      { required: true, message: 'Seats are required' },
      {
        validator: (value, _rule, { form }) => {
          const plan = (form.values.plan ?? 'free') as Plan
          const limit = PLAN_SEATS[plan]
          return typeof value !== 'number' || value <= limit || `The ${plan} plan includes at most ${limit} seats`
        },
      },
      {
        validator: (value, _rule, { form }) => {
          const invited = ((form.values.members ?? []) as Member[]).length
          return typeof value !== 'number' || value >= invited || `You already invited ${invited} members`
        },
      },
    ],
    componentProps: { type: 'number', placeholder: '3' },
    reactions: field => {
      const paid = field.record.plan !== 'free'
      field.visible = paid
      field.required = paid
    },
  }),
  billingEmail: f.Input({
    title: 'Billing email',
    description: 'Invoices for paid plans are sent here',
    validator: [{ format: 'email', message: 'Enter a valid billing email' }],
    componentProps: { placeholder: 'finance@acme.com' },
    reactions: field => {
      const paid = field.record.plan !== 'free'
      field.visible = paid
      field.required = paid
    },
  }),
  members: f.ArrayItems(
    f.Object({
      name: f.Input({
        title: 'Name',
        required: true,
        validator: [{ required: true, message: 'Member name is required' }],
        componentProps: { placeholder: 'Ada Lovelace' },
      }),
      email: f.Input({
        title: 'Email',
        required: true,
        validator: [
          { required: true, message: 'Member email is required' },
          { format: 'email', message: 'Enter a valid email address' },
          {
            validator: (value, _rule, { form }) => {
              const matches = ((form.values.members ?? []) as Member[]).filter(member => member?.email === value)
              return matches.length <= 1 || 'This email is used by another member'
            },
          },
          // An expensive check runs on blur instead of on every keystroke.
          { triggerType: 'onBlur', validator: ensureEmailAvailable },
        ],
        componentProps: { placeholder: 'ada@acme.com' },
      }),
      role: f.Select({
        title: 'Role',
        componentProps: {
          options: [
            { label: 'Member', value: 'member' },
            { label: 'Admin', value: 'admin' },
            { label: 'Billing', value: 'billing' },
          ],
        },
      }),
    }),
    {
      title: 'Members',
      required: true,
      validator: [
        { required: true, message: 'Invite at least one member' },
        {
          validator: (value, _rule, { form }) => {
            const plan = (form.values.plan ?? 'free') as Plan
            const limit = PLAN_SEATS[plan]
            return !Array.isArray(value) || value.length <= limit || `The ${plan} plan allows up to ${limit} members`
          },
        },
      ],
      // The default decorator only patches string fields; array nodes opt in explicitly.
      decorator: 'FormItem',
      componentProps: { addText: 'Add member', removeText: 'Remove' },
    }
  ),
  inviteNow: f.Checkbox({
    title: 'Send invitation emails immediately',
  }),
  message: f.Textarea({
    title: 'Invitation message',
    componentProps: { rows: 3, placeholder: 'Welcome aboard! Here is how we work…' },
    reactions: field => {
      field.visible = field.record.inviteNow === true
    },
  }),
})

const submitted = ref('')
const error = ref('')

const summary = computed(() => {
  const plan = form.values.plan ?? 'free'
  const members = form.values.members ?? []
  const ready = members.filter(member => member?.email).length
  return `${ready}/${members.length} invitations ready · ${plan} allows ${PLAN_SEATS[plan]} members`
})

// Path-based bulk update: the same pattern works for any repeated group.
function assignMemberRoleToAll() {
  form.setFieldState('members.*.role', field => {
    field.value = 'member'
  })
}

async function onSubmit() {
  error.value = ''
  try {
    submitted.value = JSON.stringify(await form.submit(), null, 2)
  } catch {
    submitted.value = ''
    error.value = 'Please fix the highlighted fields.'
  }
}

function onReset() {
  form.reset()
  submitted.value = ''
  error.value = ''
}
</script>

<template>
  <FormProvider :form="form">
    <div class="dv-demo">
      <SchemaField :schema="schema" />
      <div class="dv-actions">
        <button type="button" class="dv-btn dv-btn--ghost" @click="assignMemberRoleToAll">
          Set all roles to Member
        </button>
        <button type="button" class="dv-btn" :disabled="form.submitting" @click="onSubmit">
          {{ form.submitting ? 'Creating…' : 'Create team' }}
        </button>
        <button type="button" class="dv-btn dv-btn--ghost" @click="onReset">Reset</button>
      </div>
      <div class="dv-result">{{ summary }}</div>
      <div v-if="error" class="dv-result dv-result--error">{{ error }}</div>
      <div v-if="submitted" class="dv-result">
        <pre>{{ submitted }}</pre>
      </div>
    </div>
  </FormProvider>
</template>
