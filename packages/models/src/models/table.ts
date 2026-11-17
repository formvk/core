import type { Form, IFormProps } from '@formvk/core'
import { createForm } from '@formvk/core'
import { observable, shallowRef } from '@formvk/reactive'
import type { Stringify } from '@formvk/schema'
import { Schema } from '@formvk/schema'
import { clone } from '@formvk/shared'

import type { IPagination, ITableResult } from '../types'
import type { PopupOptions } from './popup'
import { PopupModel } from './popup'

export interface TableOptions<
  IRecord extends object = any,
  IState extends object = any,
  ISearchValues extends object = Partial<IRecord>,
  IEditValues extends object = Partial<IRecord>,
  IAddValues extends object = Partial<IRecord>,
> {
  state?: IState
  /**
   * 搜索方法
   * @param values 搜索表单数据
   * @param pagination 分页数据
   * @returns 表格数据
   */
  search?: (values: ISearchValues, pagination: IPagination) => Promise<ITableResult<IRecord> | false | void | IRecord[]>
  /**
   * 编辑方法
   * @param values 编辑表单数据
   * @returns 是否成功，返回 true 时会自动刷新表格数据
   */
  edit?: (values: IEditValues) => Promise<boolean | void>
  /**
   * 新增方法
   * @param values 新增表单数据
   * @returns 是否成功，返回 true 时会自动刷新表格数据并把分页重置到第一页
   */
  add?: (values: IAddValues) => Promise<boolean | void>
  /**
   * 删除方法
   * @param record 要删除的记录
   * @returns 是否成功，返回 true 时会自动刷新表格数据
   */
  remove?: (record: IRecord) => Promise<boolean | void>
  /**
   * 是否在挂载时自动加载
   * @default true
   */
  auto?: boolean
  addOptions?: PopupOptions<IAddValues>
  editOptions?: PopupOptions<IEditValues>
  searchOptions?: IFormProps<ISearchValues>
  pagination?: Partial<IPagination>
}

/**
 * 表格模型：聚合搜索表单、分页、记录、新增/编辑弹窗与删除动作。
 * 只负责数据流转，渲染交给 React / Vue 的表格容器。
 */
export class TableModel<
  IRecord extends object = any,
  IState extends object = any,
  ISearchValues extends object = any,
  IEditValues extends object = any,
  IAddValues extends object = any,
> {
  static defaultPagination: IPagination = {
    current: 1,
    pageSize: 20,
    total: 0,
  }

  @observable accessor state: IState

  @shallowRef accessor form: Form<ISearchValues>

  @shallowRef accessor pagination: IPagination = { ...TableModel.defaultPagination }

  @shallowRef accessor records: IRecord[] = []

  @shallowRef accessor addPopup: PopupModel<IAddValues>

  @shallowRef accessor editPopup: PopupModel<IEditValues>

  constructor(public options: TableOptions<IRecord, IState, ISearchValues, IEditValues, IAddValues>) {
    this.form = createForm<ISearchValues>(options.searchOptions)
    this.addPopup = new PopupModel(values => this.onAdd(values), options.addOptions)
    this.editPopup = new PopupModel(values => this.onEdit(values), options.editOptions)
    this.state = options.state || ({} as IState)
    this.setPagination(options.pagination)
  }

  setPagination(pagination?: Partial<IPagination>) {
    if (pagination) {
      this.pagination = { ...this.pagination, ...pagination }
    }
  }

  /**
   * 调用 search 并写入结果：数组按条数计算 total，对象合并其分页信息
   */
  private async load(values: ISearchValues) {
    const result = await this.options.search?.(values, this.pagination)
    if (!result) {
      return result
    }
    if (Array.isArray(result)) {
      this.records = result
      this.setPagination({ total: result.length })
    } else {
      this.records = result.records || []
      this.setPagination(result.pagination)
    }
    return result
  }

  /**
   * 执行新增/编辑，成功后回到第一页刷新
   */
  private async mutate<IValues extends object>(
    action: ((values: IValues) => Promise<boolean | void>) | undefined,
    values: IValues
  ) {
    const result = await action?.(values)
    if (result) {
      this.setPagination({ current: 1 })
      this.search()
    }
    return result
  }

  /**
   * 重置搜索表单并从第一页重新加载
   */
  async resetSearch() {
    try {
      this.form.setLoading(true)
      this.setPagination({ current: 1 })
      await this.load(clone(this.form.values))
    } finally {
      this.form.setLoading(false)
    }
  }

  /**
   * 翻页搜索，不传分页时回到第一页
   */
  async onSearch(pagination?: IPagination) {
    this.setPagination(pagination || { current: 1 })
    return this.search()
  }

  /**
   * 提交搜索表单并加载数据
   */
  async search() {
    return this.form.submit(values => this.load(values))
  }

  onMount() {
    if (this.options.auto !== false) {
      this.onSearch()
    }
  }

  async onAdd(values: IAddValues) {
    return this.mutate(this.options.add, values)
  }

  async onEdit(values: IEditValues) {
    return this.mutate(this.options.edit, values)
  }

  /**
   * 删除记录
   * @param record 要删除的记录
   * @param cb 删除成功后的回调，传入时代替内置的 search 调用（可 await）
   * @returns 是否成功
   */
  async onRemove(record: IRecord, cb?: () => unknown | Promise<unknown>) {
    const result = await this.options.remove?.(record)
    if (result) {
      if (cb) {
        await cb()
      } else {
        this.search()
      }
    }
    return result
  }

  compile<T>(columns: Stringify<T>[], scope: object = {}): T[] {
    return Schema.compile(columns, {
      ...scope,
      $table: this,
      $state: this.state,
    })
  }
}
