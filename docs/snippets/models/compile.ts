import { TableModel } from '@formvk/models'

interface UserRecord {
  id: number
  name: string
  role: string
}

export const table = new TableModel<UserRecord, { keyword: string }, { keyword?: string }>({
  auto: false,
  state: { keyword: '' },
  search: async (_values, pagination) => ({
    records: [],
    pagination: { ...pagination, total: 0 },
  }),
})

// #region compile
export const columns = table.compile([
  { title: 'ID', dataIndex: 'id' },
  { title: '{{$state.keyword}}', dataIndex: 'name' },
])
// #endregion
