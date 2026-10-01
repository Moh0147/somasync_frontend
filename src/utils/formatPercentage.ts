/** Display percentages consistently without exposing noisy backend precision. */
export function formatPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  return Number.isFinite(number) ? `${number.toFixed(1)}%` : '—'
}
