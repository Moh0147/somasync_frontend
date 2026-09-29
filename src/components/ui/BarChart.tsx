export interface BarChartItem {
  label: string
  value: number
}

interface BarChartProps {
  items: BarChartItem[]
  valueFormatter?: (value: number) => string
}

// Dependency-free "lightweight chart" -- a horizontal bar list built from
// plain divs, matching ProgressBar's visual language. No charting library
// needed for this, and it keeps the low-end-Android bundle budget intact.
export function BarChart({ items, valueFormatter = (value) => String(value) }: BarChartProps) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>{item.label}</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{valueFormatter(item.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${Math.max(0, Math.min(100, (item.value / maxValue) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
