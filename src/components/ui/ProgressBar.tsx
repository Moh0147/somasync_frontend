interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
}

export function ProgressBar({ value, max = 100, label, showPercentage = true }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="flex flex-col gap-1">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
