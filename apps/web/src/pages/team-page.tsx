import { PageHeader } from '@/components/common/page-header';
import { TeamSettings } from '@/features/settings/team-settings';

export function TeamPage() {
  return (
    <>
      <PageHeader title="Team members" description="Invite colleagues and manage their roles." />
      <TeamSettings />
    </>
  );
}