---
layout: home

hero:
  name: Formvk
  text: Schema-first forms for Vue 3 and React
  tagline: A typed schema DSL, a fine-grained reactive core and ready-to-use Vue and React bindings — all in one engine.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Live Examples
      link: /examples/basic-form
    - theme: alt
      text: 简体中文
      link: /zh/

features:
  - title: Schema-first
    details: Describe a form as a JSON schema and let the engine create fields, validate values and react to changes.
  - title: Fine-grained reactivity
    details: Built on top of Vue reactivity. Components re-render only when the state they read actually changes.
  - title: Typed schema DSL
    details: createFragment infers field values, array items and component props from the schema you write.
  - title: Composable packages
    details: Reactive core, form models, schema tools and isomorphic Vue / React bindings live in separate packages you can mix and match.
  - title: Validation built in
    details: Declarative rules, async validators and localized messages through a small registry.
  - title: Framework-agnostic core
    details: The schema layer has no framework dependency — the same schema powers the Vue and React bindings unchanged.
---
