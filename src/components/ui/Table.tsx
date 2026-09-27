import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowKey: (row: T) => string
  emptyMessage?: string
}

export function Table<T>({ columns, data, getRowKey, emptyMessage = 'No records found.' }: TableProps<T>) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-2.5 font-medium text-slate-600">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-2.5 text-slate-700 ${column.className ?? ''}`}>
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
