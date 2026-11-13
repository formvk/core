---
layout: home

hero:
  name: Formvk
  text: 面向 Vue 3 的 Schema 表单引擎
  tagline: 类型安全的 Schema DSL、细粒度响应式内核，以及开箱即用的 Vue 绑定，统一在一个引擎里。
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: 在线示例
      link: /zh/examples/basic-form
    - theme: alt
      text: English
      link: /

features:
  - title: Schema 驱动
    details: 用 JSON schema 描述表单，引擎负责创建字段、校验取值并响应变化。
  - title: 细粒度响应式
    details: 基于 Vue 响应式实现，组件只在读取到的状态真正变化时重新渲染。
  - title: 类型安全的 DSL
    details: createFragment 会从你写的 schema 推导字段值、数组项类型与组件 props 类型。
  - title: 可组合的包
    details: 响应式内核、表单模型、Schema 工具与 Vue 绑定各自独立，可按需组合。
  - title: 内置校验
    details: 声明式规则、异步校验与多语言消息注册表。
  - title: 框架无关内核
    details: Schema 层不依赖 Vue，同一份 schema 可以支撑其他框架的绑定。
---
