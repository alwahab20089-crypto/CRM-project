import { Ellipsis, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DataTable, type Column } from '@/components/common/data-table';
import { ErrorState } from '@/components/common/error-state';
import { StatusBadge } from '@/components/common/status-badge';
import { PersonCell } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTeam } from '@/hooks/use-crm-queries';
import { formatDate } from '@/lib/format';
import { roleLabels } from '@/lib/labels';
import type { Invitation, MemberRole, TeamMember } from '@/types';
import { InviteMemberDialog, type InviteValues } from './invite-member-dialog';

const assignableRoles: MemberRole[] = ['ADMIN', 'MANAGER', 'AGENT'];

export function TeamSettings() {
  const { data, isLoading, isError, refetch } = useTeam();
  // Local overrides keep the demo interactive without a backend (Phase 3 replaces this with mutations).
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [invites, setInvites] = useState<Invitation[] | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);
  const [toRevoke, setToRevoke] = useState<Invitation | null>(null);

  const memberList = members ?? data?.members ?? [];
  const inviteList = invites ?? data?.invitations ?? [];

  const changeRole = (member: TeamMember, role: MemberRole) => {
    setMembers(memberList.map((m) => (m._id === member._id ? { ...m, role } : m)));
    toast.success(`${member.user.name} is now ${roleLabels[role]}`);
  };

  const addInvite = (values: InviteValues) => {
    const now = new Date();
    const invitation: Invitation = {
      _id: `inv_${now.getTime()}`,
      organizationId: 'org_001',
      email: values.email.toLowerCase(),
      role: values.role,
      invitedBy: 'usr_001',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
    };
    setInvites([invitation, ...inviteList]);
    toast.success(`Invitation sent to ${invitation.email} (demo mode)`);
  };

  const memberColumns: Column<TeamMember>[] = [
    { key: 'member', header: 'Member', cell: (m) => <PersonCell name={m.user.name} subtitle={m.user.email} /> },
    { key: 'role', header: 'Role', cell: (m) => <Badge variant="secondary">{roleLabels[m.role]}</Badge> },
    { key: 'status', header: 'Status', cell: (m) => <StatusBadge status={m.status} /> },
    { key: 'joined', header: 'Joined', cell: (m) => (m.joinedAt ? formatDate(m.joinedAt) : '—') },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-16 text-right',
      cell: (m) =>
        m.role === 'OWNER' ? (
          <span className="sr-only">The owner cannot be changed</span>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${m.user.name}`}>
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Change role</DropdownMenuLabel>
              {assignableRoles
                .filter((r) => r !== m.role)
                .map((r) => (
                  <DropdownMenuItem key={r} onSelect={() => changeRole(m, r)}>
                    Make {roleLabels[r]}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setToRemove(m)}>
                Remove from team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    },
  ];

  const inviteColumns: Column<Invitation>[] = [
    { key: 'email', header: 'Email', cell: (i) => <span className="font-medium">{i.email}</span> },
    { key: 'role', header: 'Role', cell: (i) => <Badge variant="secondary">{roleLabels[i.role]}</Badge> },
    { key: 'sent', header: 'Sent', cell: (i) => formatDate(i.createdAt) },
    { key: 'expires', header: 'Expires', cell: (i) => formatDate(i.expiresAt) },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (i) => (
        <Button variant="ghost" size="sm" onClick={() => setToRevoke(i)}>
          Revoke
        </Button>
      ),
    },
  ];

  if (isError) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="gap-0">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
          <div className="space-y-1.5">
            <CardTitle className="text-section-title">Team members</CardTitle>
            <CardDescription>Manage who has access to this organization.</CardDescription>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus /> Invite member
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <DataTable columns={memberColumns} rows={memberList} getRowId={(m) => m._id} isLoading={isLoading} caption="Team members" />
        </CardContent>
      </Card>

      <Card className="gap-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-section-title">Pending invitations</CardTitle>
          <CardDescription>Invitations expire after 7 days.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <DataTable
            columns={inviteColumns}
            rows={inviteList}
            getRowId={(i) => i._id}
            isLoading={isLoading}
            caption="Pending invitations"
            emptyTitle="No pending invitations"
            emptyDescription="Invite a colleague to get started."
          />
        </CardContent>
      </Card>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvite={addInvite} />

      <ConfirmDialog
        open={toRemove !== null}
        onOpenChange={(open) => !open && setToRemove(null)}
        title="Remove team member?"
        description={`${toRemove?.user.name ?? 'This member'} will lose access immediately. Their records stay in the organization.`}
        confirmLabel="Remove member"
        destructive
        onConfirm={() => {
          if (!toRemove) return;
          setMembers(memberList.filter((m) => m._id !== toRemove._id));
          toast.success(`${toRemove.user.name} removed (demo mode)`);
          setToRemove(null);
        }}
      />
      <ConfirmDialog
        open={toRevoke !== null}
        onOpenChange={(open) => !open && setToRevoke(null)}
        title="Revoke invitation?"
        description={`${toRevoke?.email ?? 'This invitation'} will no longer be able to join.`}
        confirmLabel="Revoke invitation"
        destructive
        onConfirm={() => {
          if (!toRevoke) return;
          setInvites(inviteList.filter((i) => i._id !== toRevoke._id));
          toast.success('Invitation revoked (demo mode)');
          setToRevoke(null);
        }}
      />
    </div>
  );
}