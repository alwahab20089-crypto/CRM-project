import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="text-7xl font-semibold tracking-tight text-primary">404</p>
        <h1 className="mt-4 text-page-title">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you are looking for does not exist or has moved.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go back
          </Button>
          <Button asChild>
            <Link to="/app/dashboard">Go to overview</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}