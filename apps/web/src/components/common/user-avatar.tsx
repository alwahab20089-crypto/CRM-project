import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';

export function UserAvatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}

export function PersonCell({ name, subtitle, className }: { name: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <UserAvatar name={name} className="size-8" />
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}