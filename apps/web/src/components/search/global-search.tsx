import { Building2, Contact, ListChecks, Target, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Highlight } from '@/components/common/highlight';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useContacts, useLeads, useProperties, useTasks } from '@/hooks/use-crm-queries';
import { fullName } from '@/lib/format';
import { humanize } from '@/lib/labels';

type Group = 'Leads' | 'Contacts' | 'Properties' | 'Tasks';
interface SearchResult {
  id: string;
  group: Group;
  title: string;
  subtitle: string;
  to: string;
}

const groupIcons: Record<Group, LucideIcon> = { Leads: Target, Contacts: Contact, Properties: Building2, Tasks: ListChecks };
const groups: Group[] = ['Leads', 'Contacts', 'Properties', 'Tasks'];

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const leads = useLeads().data;
  const contacts = useContacts().data;
  const properties = useProperties().data;
  const tasks = useTasks().data;

  const all = useMemo<SearchResult[]>(
    () => [
      ...(leads ?? []).map((l) => ({ id: l._id, group: 'Leads' as const, title: fullName(l), subtitle: `${humanize(l.status)} · ${l.phone}`, to: '/app/leads' })),
      ...(contacts ?? []).map((c) => ({ id: c._id, group: 'Contacts' as const, title: fullName(c), subtitle: `${humanize(c.contactType)} · ${c.phone}`, to: '/app/contacts' })),
      ...(properties ?? []).map((p) => ({ id: p._id, group: 'Properties' as const, title: p.title, subtitle: `${p.city}, ${p.area} · ${humanize(p.listingStatus)}`, to: '/app/properties' })),
      ...(tasks ?? []).map((t) => ({ id: t._id, group: 'Tasks' as const, title: t.title, subtitle: `${humanize(t.taskType)} · ${humanize(t.status)}`, to: '/app/tasks' })),
    ],
    [leads, contacts, properties, tasks],
  );

  const needle = query.trim().toLowerCase();
  const limit = needle ? 5 : 3;
  const results = useMemo(
    () =>
      groups
        .map((group) => ({
          group,
          items: all
            .filter((r) => r.group === group && (!needle || `${r.title} ${r.subtitle}`.toLowerCase().includes(needle)))
            .slice(0, limit),
        }))
        .filter((g) => g.items.length > 0),
    [all, needle, limit],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery('');
    onOpenChange(next);
  };

  const go = (result: SearchResult) => {
    handleOpenChange(false);
    navigate(result.to);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl [&>button]:hidden">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <DialogDescription className="sr-only">Search leads, contacts, properties and tasks.</DialogDescription>
        <Command shouldFilter={false} label="Global search">
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search leads, contacts, properties, tasks…" />
          <CommandList className="max-h-96">
            <CommandEmpty>No results for “{query}”.</CommandEmpty>
            {results.map(({ group, items }) => {
              const Icon = groupIcons[group];
              return (
                <CommandGroup key={group} heading={group}>
                  {items.map((item) => (
                    <CommandItem key={item.id} value={item.id} onSelect={() => go(item)} className="gap-3">
                      <Icon className="size-4 text-muted-foreground" aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          <Highlight text={item.title} query={query} />
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          <Highlight text={item.subtitle} query={query} />
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
          <div className="hidden items-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground sm:flex">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}