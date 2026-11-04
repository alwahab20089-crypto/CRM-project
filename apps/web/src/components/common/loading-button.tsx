import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';

export function LoadingButton({ loading = false, children, disabled, ...props }: ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}