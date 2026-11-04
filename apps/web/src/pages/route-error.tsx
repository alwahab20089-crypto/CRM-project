import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unknown error occurred.';
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <ErrorState message={message} retryLabel="Reload page" onRetry={() => window.location.reload()} />
    </div>
  );
}