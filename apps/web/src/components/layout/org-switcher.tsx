import { Building2, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';

export function OrgSwitcher() {
  const { organizations, activeOrganizationId, switchOrganization } = useAuth();
  const active = organizations.find((m) => m.organization._id === activeOrganizationId)?.organization;

  const onChange = async (id: string) => {
    try {
      await switchOrganization(id);
      const name = organizations.find((m) => m.organization._id === id)?.organization.name;
      toast.success(`Switched to ${name ?? 'organization'}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not switch organization');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Switch organization" className="max-w-52 gap-2">
          <Building2 className="size-4 shrink-0" aria-hidden />
          <span className="hidden truncate md:inline">{active?.name ?? 'Organization'}</span>
          <ChevronsUpDown className="hidden size-3.5 shrink-0 text-muted-foreground md:inline" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={activeOrganizationId ?? ''} onValueChange={onChange}>
          {organizations.map(({ organization }) => (
            <DropdownMenuRadioItem key={organization._id} value={organization._id}>
              {organization.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}