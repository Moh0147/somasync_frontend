import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowKey: (row: T) => string
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function Table<T>({ columns, data, getRowKey, emptyMessage = 'No records found.', onRowClick }: TableProps<T>) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90 text-left dark:border-slate-800 dark:bg-slate-800/70">
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400${column.hideOnMobile ? ' hidden sm:table-cell' : ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row) } } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={`border-b border-slate-100 transition-colors duration-150 last:border-b-0 hover:bg-blue-50/60 dark:border-slate-800 dark:hover:bg-blue-500/5${onRowClick ? ' cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500' : ''}`}
            >
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-middle text-slate-700 dark:text-slate-300${column.hideOnMobile ? ' hidden sm:table-cell' : ''} ${column.className ?? ''}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
