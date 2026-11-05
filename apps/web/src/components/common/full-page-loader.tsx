import { LoaderCircle } from 'lucide-react';

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="grid min-h-dvh place-items-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" aria-hidden />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}