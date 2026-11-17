<script setup lang="ts">
import { TableModel } from '@formvk/models'
import { createSchema, createSchemaField } from '@formvk/vue'
import { onMounted } from 'vue'

import { DemoArrayItems, demoComponents, FormItem } from './components'
import DemoPopup from './components/DemoPopup.vue'
import DemoSearch from './components/DemoSearch.vue'
import DemoTable from './components/DemoTable.vue'

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
  { key: 'name', title: 'Name' },
  { key: 'role', title: 'Role' },
]

const { fragment: f } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})

const searchSchema = createSchema({
  keyword: f.Input({
    title: 'Keyword',
    componentProps: { placeholder: 'Search by name' },
  }),
})

// 弹窗表单与表格共用一个 schema：PopupModel 每次 open 重建 form，schema 保持稳定
const userSchema = createSchema({
  name: f.Input({
    title: 'Name',
    required: true,
    validator: [{ required: true, message: 'Name is required' }],
    componentProps: { placeholder: 'Alice' },
  }),
  role: f.Select({
    title: 'Role',
    required: true,
    validator: [{ required: true, message: 'Please select a role' }],
    componentProps: {
      placeholder: 'Select a role',
      options: [
        { label: 'Developer', value: 'developer' },
        { label: 'Designer', value: 'designer' },
        { label: 'Product manager', value: 'pm' },
      ],
    },
  }),
})

const actions = [
  { label: 'Edit', onClick: (record: UserRecord) => table.editPopup.open(record) },
  { label: 'Delete', danger: true, onClick: (record: UserRecord) => table.onRemove(record) },
]

function onPageChange(current: number) {
  table.onSearch({ ...table.pagination, current })
}

onMounted(() => table.onMount())
</script>

<template>
  <div class="demo">
    <DemoTable
      :columns="columns"
      :records="table.records"
      :actions="actions"
      :pagination="table.pagination"
      create-text="Add"
      @create="table.addPopup.open()"
      @page-change="onPageChange"
    >
      <template #toolbar>
        <DemoSearch :model="table" :schema="searchSchema" />
      </template>
    </DemoTable>

    <DemoPopup :model="table.addPopup" :schema="userSchema" title="Add user" />

    <DemoPopup :model="table.editPopup" :schema="userSchema" title="Edit user" />
  </div>
</template>
