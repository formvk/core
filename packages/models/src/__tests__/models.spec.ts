import { describe, expect, test, vi } from 'vitest'

import { PopupModel, TableModel } from '..'

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

describe('PopupModel', () => {
  test('open 用传入值重建表单并显示', () => {
    const model = new PopupModel(() => Promise.resolve(true), {
      initialValues: { name: 'initial' },
    })
    model.open({ name: 'draft' })
    expect(model.visible).toBe(true)
    expect(model.form.values.name).toBe('draft')
    expect(model.form.initialValues.name).toBe('initial')
  })

  test('无参 open 不会覆盖 options 中的默认值', () => {
    const model = new PopupModel(() => Promise.resolve(true), {
      values: { name: 'default' },
    })
    model.open()
    expect(model.form.values.name).toBe('default')
  })

  test('提交成功自动关闭，失败保持打开', async () => {
    const submit = vi.fn(async () => true)
    const model = new PopupModel(submit)
    model.open()
    await expect(model.onSubmit()).resolves.toBe(true)
    expect(submit).toHaveBeenCalledTimes(1)
    expect(model.visible).toBe(false)

    const failing = new PopupModel(async () => false)
    failing.open()
    await expect(failing.onSubmit()).resolves.toBe(false)
    expect(failing.visible).toBe(true)
  })

  test('close 只关闭弹窗，不销毁表单', () => {
    const model = new PopupModel(() => Promise.resolve(true))
    model.open({ name: 'kept' })
    const form = model.form
    model.close()
    expect(model.visible).toBe(false)
    expect(model.form).toBe(form)
  })
})

describe('TableModel', () => {
  test('search 写入记录与分页信息', async () => {
    const search = vi.fn(async (_values: any, pagination: any) => ({
      records: [{ id: 1 }],
      pagination: { ...pagination, total: 1 },
    }))
    const model = new TableModel({ auto: false, search })
    await model.search()
    expect(model.records).toEqual([{ id: 1 }])
    expect(model.pagination).toEqual({ current: 1, pageSize: 20, total: 1 })
  })

  test('搜索返回数组时自动计算 total', async () => {
    const model = new TableModel({ auto: false, search: async () => [{ id: 1 }, { id: 2 }] })
    await model.search()
    expect(model.pagination.total).toBe(2)
    expect(model.records).toHaveLength(2)
  })

  test('onSearch 传入分页时按该页加载，不传时回到第一页', async () => {
    const search = vi.fn(async () => [])
    const model = new TableModel({ auto: false, search })
    model.setPagination({ current: 3 })
    await model.onSearch()
    expect(model.pagination.current).toBe(1)
    await model.onSearch({ current: 2, pageSize: 50, total: 100 })
    expect(model.pagination).toMatchObject({ current: 2, pageSize: 50 })
  })

  test('onMount 默认自动加载，auto 为 false 时不加载', async () => {
    const search = vi.fn(async () => [])
    new TableModel({ search }).onMount()
    await tick()
    expect(search).toHaveBeenCalledTimes(1)

    const silent = vi.fn(async () => [])
    new TableModel({ auto: false, search: silent }).onMount()
    await tick()
    expect(silent).not.toHaveBeenCalled()
  })

  test('onAdd 成功后回到第一页并刷新', async () => {
    const search = vi.fn(async () => [])
    const model = new TableModel({ auto: false, search, add: async () => true })
    model.setPagination({ current: 3 })
    await expect(model.onAdd({ name: 'new' })).resolves.toBe(true)
    await tick()
    expect(search).toHaveBeenCalledTimes(1)
    expect(model.pagination.current).toBe(1)
  })

  test('onEdit / onRemove 成功后刷新，失败时不动', async () => {
    const search = vi.fn(async () => [])
    const edit = vi.fn(async () => true)
    const remove = vi.fn(async () => false)
    const model = new TableModel<{ id: number }>({ auto: false, search, edit, remove })
    await model.onEdit({ id: 1 })
    await tick()
    expect(search).toHaveBeenCalledTimes(1)
    await model.onRemove({ id: 1 })
    await tick()
    expect(search).toHaveBeenCalledTimes(1)
  })

  test('onRemove 传入回调时用回调代替内置刷新', async () => {
    const search = vi.fn(async () => [])
    const model = new TableModel<{ id: number }>({ auto: false, search, remove: async () => true })
    const cb = vi.fn()
    await model.onRemove({ id: 1 }, cb)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(search).not.toHaveBeenCalled()
  })

  test('resetSearch 清空分页到第一页并携带表单值重新搜索', async () => {
    const search = vi.fn(async () => [])
    const model = new TableModel<{ id: number }, any, { keyword?: string }>({
      auto: false,
      search,
    })
    model.form.setValues({ keyword: 'formvk' })
    model.setPagination({ current: 3 })
    await model.resetSearch()
    expect(model.pagination.current).toBe(1)
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: 'formvk' }),
      expect.objectContaining({ current: 1 })
    )
  })

  test('compile 注入 $table / $state 并编译表达式', () => {
    const model = new TableModel<{ id: number }, { keyword: string }>({
      auto: false,
      state: { keyword: 'formvk' },
      search: async () => [],
    })
    const columns = model.compile([
      { title: '{{$state.keyword}}', dataIndex: 'id' },
      { title: '{{$table.records.length}}', dataIndex: 'id' },
    ])
    expect(columns[0].title).toBe('formvk')
    expect(columns[1].title).toBe(0)
  })
})
