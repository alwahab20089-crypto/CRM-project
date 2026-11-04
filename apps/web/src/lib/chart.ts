export const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export const pipelineColors: Record<string, string> = {
  NEW: 'var(--chart-1)',
  CONTACTED: 'var(--chart-2)',
  QUALIFIED: 'var(--chart-3)',
  NEGOTIATION: 'var(--chart-4)',
  WON: 'var(--success)',
  LOST: 'var(--destructive)',
};

export const tooltipStyle = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--popover-foreground)',
  fontSize: 12,
} as const;

export const axisTick = { fontSize: 12, fill: 'var(--muted-foreground)' } as const;