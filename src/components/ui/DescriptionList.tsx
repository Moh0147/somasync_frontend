interface DescriptionItem {
  label: string
  value: string
}

interface DescriptionListProps {
  items: DescriptionItem[]
}

export function DescriptionList({ items }: DescriptionListProps) {
  return (
    <dl className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-sm text-slate-500 dark:text-slate-400">{item.label}</dt>
          <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
