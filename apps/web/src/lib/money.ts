/** Money crosses the API as integer MINOR units (cents). The UI works in major units. */
function exponent(currency: string): number {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export const toMinorUnits = (major: number, currency: string) =>
  Math.round(Number((major * 10 ** exponent(currency)).toFixed(2)));

export const fromMinorUnits = (minor: number, currency: string) => minor / 10 ** exponent(currency);

export function formatMinor(minor: number, currency: string, compact = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : exponent(currency),
  }).format(fromMinorUnits(minor, currency));
}

export function formatBudget(budget: { min: number | null; max: number | null; currency: string } | null, compact = false) {
  if (!budget || (budget.min === null && budget.max === null)) return '—';
  const { min, max, currency } = budget;
  if (min !== null && max !== null) return `${formatMinor(min, currency, compact)} – ${formatMinor(max, currency, compact)}`;
  if (min !== null) return `From ${formatMinor(min, currency, compact)}`;
  return `Up to ${formatMinor(max as number, currency, compact)}`;
}