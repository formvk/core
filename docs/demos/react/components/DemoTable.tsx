import type { ReactNode } from 'react'

import './dr-table.css'

export interface DemoTableColumn {
  key: string
  title: string
}

export interface DemoTableAction {
  label: string
  danger?: boolean
  onClick: (record: any) => void
}

export interface DemoTablePagination {
  current: number
  pageSize: number
  total: number
}

export interface DemoTableProps {
  columns: DemoTableColumn[]
  records: Record<string, any>[]
  actions?: DemoTableAction[]
  pagination?: DemoTablePagination
  empty?: string
  createText?: string
  toolbar?: ReactNode
  onPageChange?: (current: number) => void
  onCreate?: () => void
}

export function DemoTable({
  columns,
  records,
  actions,
  pagination,
  empty = '暂无数据',
  createText,
  toolbar,
  onPageChange,
  onCreate,
}: DemoTableProps) {
  const pageCount = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1

  return (
    <div className="dr-table">
      {toolbar ? <div className="dr-table__toolbar">{toolbar}</div> : null}

      <table className="dr-table__table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>{column.title}</th>
            ))}
            {actions?.length ? <th>操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={record.id ?? index}>
              {columns.map(column => (
                <td key={column.key}>{record[column.key]}</td>
              ))}
              {actions?.length ? (
                <td className="dr-table__actions">
                  {actions.map(action => (
                    <button
                      key={action.label}
                      type="button"
                      className={
                        action.danger ? 'dr-table__btn dr-table__btn--danger' : 'dr-table__btn dr-table__btn--ghost'
                      }
                      onClick={() => action.onClick(record)}
                    >
                      {action.label}
                    </button>
                  ))}
                </td>
              ) : null}
            </tr>
          ))}
          {records.length === 0 ? (
            <tr>
              <td className="dr-table__empty" colSpan={columns.length + (actions?.length ? 1 : 0)}>
                {empty}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {pagination || createText ? (
        <div className="dr-table__footer">
          {pagination ? (
            <>
              <button
                type="button"
                className="dr-table__btn dr-table__btn--ghost"
                disabled={pagination.current <= 1}
                onClick={() => onPageChange?.(pagination.current - 1)}
              >
                上一页
              </button>
              <span>
                {pagination.current} / {pageCount}
              </span>
              <button
                type="button"
                className="dr-table__btn dr-table__btn--ghost"
                disabled={pagination.current >= pageCount}
                onClick={() => onPageChange?.(pagination.current + 1)}
              >
                下一页
              </button>
            </>
          ) : null}
          {createText ? (
            <button type="button" className="dr-table__btn dr-table__create" onClick={onCreate}>
              {createText}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
