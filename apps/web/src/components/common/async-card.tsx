import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ErrorState } from './error-state';

interface AsyncCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  skeletonHeight?: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function AsyncCard({
  title,
  description,
  action,
  isLoading,
  isError,
  onRetry,
  skeletonHeight = 'h-64',
  className,
  contentClassName,
  children,
}: AsyncCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="text-section-title">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className={contentClassName}>
        {isLoading ? (
          <div aria-busy="true" aria-label={`Loading ${title}`}>
            <Skeleton className={cn('w-full', skeletonHeight)} />
          </div>
        ) : isError ? (
          <ErrorState onRetry={onRetry} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}