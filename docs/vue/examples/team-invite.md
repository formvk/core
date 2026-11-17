# Business Scenario: Team Invitation

Every other example isolates one feature. This one is a complete product flow: a SaaS onboarding form where an admin creates a team, picks a plan and invites members. It is built the way a real feature is built — business rules first, then the schema — so it answers the question reference pages cannot: **when should I reach for each capability?**

<demo vue="../../demos/team-invite.vue" stackblitz="true" />

Each section below points at the part of the file that implements the rule.

## What the feature needs

| #   | Business rule                                                                    | Capability used                       | Reference                                                   |
| --- | -------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| 1   | One typed value model shared by the schema, validators and the submit handler    | `createForm<TeamInviteValues>`        | [Form model](/core/)                                        |
| 2   | Team name is required and 3–30 characters                                        | rule array                            | [Validation](/core/validation)                              |
| 3   | Seats and billing email only exist on paid plans, and become required            | `reactions`                           | [Reactions](/schema/#reactions)                             |
| 4   | The invitation message only appears when emails are sent immediately             | `reactions`                           | [Schema overview](/schema/#reactions)                       |
| 5   | Members are a repeatable group with add / remove                                 | `ArrayField` + `ArrayItems`           | [Array list](/vue/examples/array-list)                      |
| 6   | Seats must cover every invited member and stay inside the plan limit             | custom `validator` reading `ctx.form` | [Validation](/core/validation#write-a-custom-rule)          |
| 7   | The same email cannot be invited twice, and taken emails are rejected on blur    | cross-field + async validators        | [Validation](/core/validation#control-when-validation-runs) |
| 8   | Removing the last member row keeps one empty row; switching emails off clears it | `effects`                             | [Effects](/core/#effects)                                   |
| 9   | A toolbar action assigns a role to every member                                  | path wildcard + `form.setFieldState`  | [Path system](/core/paths)                                  |
| 10  | A live summary counts ready invitations                                          | observable values in a `computed`     | [Reactivity](/core/reactivity)                              |

The rest of the page walks through these in order.

## 1. Model the value type once

Start with the shape of what the API receives, not with the schema. `createForm<T>` makes `form.values` typed everywhere, and the same interface documents the payload:

```ts
interface TeamInviteValues {
  teamName: string
  plan: 'free' | 'pro' | 'enterprise'
  seats?: number
  billingEmail?: string
  members: Array<{ name?: string; email?: string; role?: string }>
  inviteNow: boolean
  message?: string
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
})
```

**Why not derive the type from the schema?** You can (`createSchema` carries `_$types$_`), but the form value type is also used by validators and by the submit handler. Declaring it first keeps the schema honest: a typo in a field name shows up as a type error instead of a silently missing value.

## 2. Build the schema with the component map

`createSchemaField` classifies components once and returns a typed `fragment`, so no component map is written by hand:

```ts
const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents, // Input, NumberInput, Select, Checkbox, Textarea
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})
```

`defaultDecorator: 'FormItem'` wraps every titled string field with the label / required mark / error slot. It deliberately skips array nodes, which is why `members` sets `decorator: 'FormItem'` explicitly.

## 3. Conditional sections: `reactions`

**When to use it:** a field's visibility, required flag, title or component props depend on other values. This is the everyday case.

The paid-only block (`seats`, `billingEmail`) shares one reaction shape:

```ts
seats: f.NumberInput({
  title: 'Seats',
  reactions: field => {
    const paid = field.form.values.plan !== 'free'
    field.visible = paid
    field.required = paid
  },
})
```

- A reaction is a plain function `(field) => void`. Reading `field.form.values.plan` inside it makes `plan` a dependency — there is no path list to keep in sync with the code.
- Assigning `field.visible` / `field.required` is the whole update. The function re-runs automatically whenever `plan` changes.
- `visible: false` sets `display: 'none'`. The field is not rendered, is skipped by `form.validate()`, **and its value leaves `form.values`** — a free-plan submit never carries `seats` or `billingEmail`. That is usually what you want for “this section does not exist on this plan”.
- If the field should keep its value, use `hidden: true` instead: the node disappears but the value stays in the payload.

The invitation message is the same function with `inviteNow` as its only read, without touching `required`.

## 4. Members: the repeatable group

An array node is a normal field whose value is an array. The `ArrayItems` component owns the layout and renders each item with `RecursionField`; the schema only describes the item shape:

```ts
members: f.ArrayItems(
  f.Object({
    name: f.Input({ title: 'Name', required: true }),
    email: f.Input({ title: 'Email', required: true }),
    role: f.Select({ title: 'Role' }),
  }),
  { title: 'Members', decorator: 'FormItem' }
)
```

- The value type is inferred as `Member[]`; `form.values.members[0].email` is typed.
- `push`, `insert`, `remove`, `move` and friends live on the `ArrayField` — see the [array list example](/vue/examples/array-list) for the component implementation.
- Every item field has the same address and path (`members.0.email`) because there are no `void` nodes in between.

**Bulk updates.** The toolbar button shows why paths matter: a wildcard reaches every item without iterating fields yourself.

```ts
form.setFieldState('members.*.role', field => {
  field.value = 'member'
})
```

Use `form.query('members.*.email').map(field => field.value)` when you need to read across the group, for example to check duplicates or build the summary.

## 5. Validation that depends on other fields

Static rule keys (`minLength`, `format`, `maximum`) cover single-field checks. The business rules here need context, so they use custom validator functions. The third argument carries `{ field, form }`:

```ts
// Seats cannot exceed the plan limit
{
  validator: (value, _rule, { form }) => {
    const plan = (form.values.plan ?? 'free') as Plan
    return typeof value !== 'number' || value <= PLAN_SEATS[plan] || `The ${plan} plan includes at most ${PLAN_SEATS[plan]} seats`
  },
},
// Seats cannot be fewer than the members already invited
{
  validator: (value, _rule, { form }) => {
    const invited = (form.values.members ?? []).length
    return typeof value !== 'number' || value >= invited || `You already invited ${invited} members`
  },
},
```

Two more shapes are worth copying:

- **Duplicates inside an array.** Compare against sibling items by filtering `form.values.members`; the rule runs on the field and can flag both duplicates.
- **Expensive checks.** The availability rule is marked `triggerType: 'onBlur'`, so it runs when the user leaves the field instead of on every keystroke. `form.submit()` still runs it.

```ts
{ triggerType: 'onBlur', validator: ensureEmailAvailable }
```

Empty values skip every non-`required` rule, so a cleared optional field never triggers a format error. Array-level rules (the plan limit) go on the `members` node itself — its `value` is the whole array.

## 6. Cross-field side effects: `effects`

**When to use it:** the outcome is not just field state, but another field's **value**, or code with branches. Reactions patch state declaratively; effects are plain callbacks.

```ts
const form = createForm<TeamInviteValues>({
  values: { ... },
  effects() {
    // Keep at least one editable row
    onFieldValueChange('members', (_field, form) => {
      if (form.values.members.length === 0) {
        form.setValuesIn('members', [{}])
      }
    })
    // Cross-field rules only run when their own field is validated,
    // so a plan change re-checks the limits that depend on it
    onFieldValueChange('plan', (_field, form) => {
      form.validate('seats')
      form.validate('members')
    })
    // Turning invitations off clears the drafted message
    onFieldValueChange('inviteNow', (field, form) => {
      if (!field.value) {
        form.setValuesIn('message', '')
      }
    })
  },
})
```

Rules of thumb:

- Use a **reaction** when the requirement reads “when X, this field becomes visible / required / disabled”.
- Use an **effect** when the requirement reads “when X, do Y to something else” — clear a value, add a row, call an API, update a store.
- A cross-field **validator** does not re-run when its dependency changes. If the dependency is another field, call `form.validate(pattern)` for that field in an effect, as the plan change above does.
- Effects registered in `createForm` live as long as the form. Component-scoped effects use `useFormEffects` from `@formvk/vue` — see [Hooks](/vue/hooks).

## 7. Submit, reset and feedback

```ts
async function onSubmit() {
  try {
    submitted.value = JSON.stringify(await form.submit(), null, 2)
  } catch {
    error.value = 'Please fix the highlighted fields.'
  }
}
```

- `form.submit()` validates every editable field, resolves with plain values (hidden-by-`none` fields excluded), and rejects with the error list.
- `form.submitting` is `true` while the promise is pending — bind it to the button.
- `form.reset()` restores the initial values, including the initial member row.
- To send the user to the first problem, read `form.errors[0].path` and focus that field. To validate one group instead of the whole form, pass a pattern: `form.validate('members.*.email')`.

## 8. Read live state in the UI

The summary at the bottom is an ordinary `computed` that reads observable values:

```ts
const summary = computed(() => {
  const plan = form.values.plan ?? 'free'
  const members = form.values.members ?? []
  const ready = members.filter(member => member?.email).length
  return `${ready}/${members.length} invitations ready · ${plan} allows ${PLAN_SEATS[plan]} members`
})
```

Vue tracks those reads automatically. In React the same code runs inside an `observer` component — that is the whole difference; see the [React version](/react/examples/team-invite).

## Choosing the right mechanism

| Requirement                                           | Use                                               |
| ----------------------------------------------------- | ------------------------------------------------- |
| Show / hide / require a field based on other values   | `reactions`                                       |
| Rewrite a value, add a row, call an API on a change   | `effects`                                         |
| Check one value against static constraints            | built-in rule keys                                |
| Check a value against siblings, arrays or remote data | custom `validator` with `ctx.form`                |
| Compute a title, placeholder or disabled flag         | schema expressions (<code v-pre>{{ ... }}</code>) |
| Update many fields at once                            | path wildcards + `setFieldState` / `query`        |
| Show read-only summary of submitted values            | `mapReadPretty` / `FormConsumer`                  |

## Next steps

- [Dynamic reactions](/vue/examples/reactions) — the minimal reaction example.
- [Array list](/vue/examples/array-list) — the array component in isolation.
- [Validation](/core/validation) — every rule shape and trigger.
- [Path system](/core/paths) — patterns, `address` vs `path`, wildcard queries.
- [React version](/react/examples/team-invite) — the same feature in TSX.
