import { TableModel } from '@formvk/models'
import { createSchema, createSchemaField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useEffect, useState } from 'react'

import { DemoArrayItems, demoComponents, FormItem } from './components'
import { DemoPopup } from './components/DemoPopup'
import { DemoSearch } from './components/DemoSearch'
import { DemoTable } from './components/DemoTable'

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

// The popup form shares one schema: PopupModel rebuilds form on every open,
// while the schema stays stable
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

function createTable() {
  return new TableModel<UserRecord, {}, { keyword?: string }>({
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
}

export default observer(function ModelsTableDemo() {
  // The model owns form, pagination and popups; the component only renders it
  const [table] = useState(createTable)

  useEffect(() => {
    table.onMount()
  }, [table])

  const actions = [
    { label: 'Edit', onClick: (record: UserRecord) => table.editPopup.open(record) },
    { label: 'Delete', danger: true, onClick: (record: UserRecord) => table.onRemove(record) },
  ]

  return (
    <div className="demo">
      <DemoTable
        columns={columns}
        records={table.records}
        actions={actions}
        pagination={table.pagination}
        createText="Add"
        onCreate={() => table.addPopup.open()}
        onPageChange={current => table.onSearch({ ...table.pagination, current })}
        toolbar={<DemoSearch model={table} schema={searchSchema} />}
      />

      <DemoPopup model={table.addPopup} schema={userSchema} title="Add user" />

      <DemoPopup model={table.editPopup} schema={userSchema} title="Edit user" />
    </div>
  )
})
