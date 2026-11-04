import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  message: string;
}

export function ComingSoonPage({ title, description, icon, message }: ComingSoonPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState
          icon={icon}
          title={`${title} is on the roadmap`}
          description={message}
          action={
            <Button asChild variant="outline">
              <Link to="/app/dashboard">Back to overview</Link>
            </Button>
          }
        />
      </Card>
    </>
  );
}