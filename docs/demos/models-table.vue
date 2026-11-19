<script setup lang="ts">
import { TableModel } from '@formvk/models'
import { createSchema, createSchemaOptions } from '@formvk/vue'
import { onMounted } from 'vue'

import { ArrayItems, components, FormItem } from './components'
import Popup from './components/Popup.vue'
import Search from './components/Search.vue'
import Table from './components/Table.vue'

interface UserRecord {
  id: number
  name: string
  role: string
}

let users: UserRecord[] = [
  { id: 1, name: 'Alice', role: 'developer' },
  { id: 2, name: 'Bob', role: 'designer' },
  { id: 3, name: 'Carol', role: 'pm' },
  { id: 4, name: 'Dave', role: 'developer' },
  { id: 5, name: 'Eve', role: 'designer' },
]
let nextId = 6

const table = new TableModel<UserRecord, {}, { keyword?: string }>({
  pagination: { current: 1, pageSize: 3 },
  searchOptions: { values: { keyword: '' } },
  search: async (values, pagination) => {
    const keyword = values.keyword?.toLowerCase() ?? ''
    const filtered = users.filter(user => user.name.toLowerCase().includes(keyword))
    const start = (pagination.current - 1) * pagination.pageSize
    return {
      records: filtered.slice(start, start + pagination.pageSize),
      pagination: { ...pagination, total: filtered.length },
    }
  },
  add: async values => {
    users.unshift({ id: nextId++, name: values.name ?? '', role: values.role ?? 'developer' })
    return true
  },
  edit: async values => {
    const user = users.find(item => item.id === values.id)
    if (user) {
      Object.assign(user, values)
    }
    return true
  },
  remove: async record => {
    users = users.filter(user => user.id !== record.id)
    return true
  },
})

const columns = [
  { key: 'id', title: 'ID' },
  { key: 'name', title: '姓名' },
  { key: 'role', title: '角色' },
]

const { fragment: f } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})

const searchSchema = createSchema({
  keyword: f.Input({
    title: '关键字',
    componentProps: { placeholder: '按姓名搜索' },
  }),
})

// 弹窗表单与表格共用一个 schema：PopupModel 每次 open 重建 form，schema 保持稳定
const userSchema = createSchema({
  name: f.Input({
    title: '姓名',
    required: true,
    validator: [{ required: true, message: '请输入姓名' }],
    componentProps: { placeholder: 'Alice' },
  }),
  role: f.Select({
    title: '角色',
    required: true,
    validator: [{ required: true, message: '请选择角色' }],
    componentProps: {
      placeholder: '请选择角色',
      options: [
        { label: '开发', value: 'developer' },
        { label: '设计', value: 'designer' },
        { label: '产品经理', value: 'pm' },
      ],
    },
  }),
})

const actions = [
  { label: '编辑', onClick: (record: UserRecord) => table.editPopup.open(record) },
  { label: '删除', danger: true, onClick: (record: UserRecord) => table.onRemove(record) },
]

function onPageChange(current: number) {
  table.onSearch({ ...table.pagination, current })
}

onMounted(() => table.onMount())
</script>

<template>
  <div class="dv-demo">
    <Table
      :columns="columns"
      :records="table.records"
      :actions="actions"
      :pagination="table.pagination"
      create-text="新增"
      @create="table.addPopup.open()"
      @page-change="onPageChange"
    >
      <template #toolbar>
        <Search :model="table" :schema="searchSchema" />
      </template>
    </Table>

    <Popup :model="table.addPopup" :schema="userSchema" title="新增用户" />

    <Popup :model="table.editPopup" :schema="userSchema" title="编辑用户" />
  </div>
</template>
