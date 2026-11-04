import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/providers/theme-provider';

const options: { value: Theme; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', description: 'Bright and clean for daytime.', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes in low light.', icon: Moon },
  { value: 'system', label: 'System', description: 'Match your device setting.', icon: Monitor },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-section-title">Appearance</CardTitle>
        <CardDescription>Choose how EstateFlow looks on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
          {options.map(({ value, label, description, icon: Icon }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-caption">{description}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}