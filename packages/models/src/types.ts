import type { TableModel } from './models/table'

/**
 * 分页信息，与表格组件的分页数据对齐
 */
export interface IPagination {
  current: number
  pageSize: number
  total: number
}

/**
 * 搜索结果：可以只返回记录数组，也可以连同分页信息一起返回
 */
export interface ITableResult<IRecord extends object> {
  records?: IRecord[]
  pagination?: IPagination
}

/**
 * 表格列表达式的作用域：`$table` 为表格模型本身，`$state` 为表格附加状态
 */
export type TableScope<Model extends TableModel = TableModel, State = Model['state']> = {
  $table: Model
  $state: State
}
