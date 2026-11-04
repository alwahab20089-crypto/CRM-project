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
import { useActiveOrganization, useOrganizations } from '@/hooks/use-crm-queries';
import { useAuth } from '@/providers/auth-provider';

export function OrgSwitcher() {
  const { activeOrganizationId, setActiveOrganizationId } = useAuth();
  const { data: organizations = [] } = useOrganizations();
  const { organization } = useActiveOrganization();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Switch organization" className="max-w-52 gap-2">
          <Building2 className="size-4 shrink-0" aria-hidden />
          <span className="hidden truncate md:inline">{organization?.name ?? 'Organization'}</span>
          <ChevronsUpDown className="hidden size-3.5 shrink-0 text-muted-foreground md:inline" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={organization?._id ?? activeOrganizationId}
          onValueChange={(id) => {
            setActiveOrganizationId(id);
            const next = organizations.find((o) => o._id === id);
            toast.success(`Switched to ${next?.name ?? 'organization'} (demo data)`);
          }}
        >
          {organizations.map((org) => (
            <DropdownMenuRadioItem key={org._id} value={org._id}>
              {org.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

