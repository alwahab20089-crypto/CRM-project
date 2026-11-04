import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormField, fieldA11y } from '@/components/common/form-field';
import { LoadingButton } from '@/components/common/loading-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useActiveOrganization } from '@/hooks/use-crm-queries';
import { sleep } from '@/lib/utils';

const currencies = ['USD', 'EUR', 'GBP', 'AED', 'PKR', 'INR'];
const timezones = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata'];

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the organization name').max(100),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().trim().min(5, 'Enter a phone number').max(30),
  line1: z.string().trim().min(2, 'Enter a street address'),
  city: z.string().trim().min(1, 'Enter a city'),
  state: z.string().trim().min(1, 'Enter a state or region'),
  country: z.string().trim().min(1, 'Enter a country'),
  postalCode: z.string().trim().min(1, 'Enter a postal code'),
  currency: z.string().min(1),
  timezone: z.string().min(1),
});
type Values = z.infer<typeof schema>;

export function OrganizationSettings() {
  const { organization, isLoading } = useActiveOrganization();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: organization
      ? { name: organization.name, email: organization.email, phone: organization.phone, ...organization.address, currency: organization.currency, timezone: organization.timezone }
      : undefined,
  });

  if (isLoading || !organization) return <Skeleton className="h-96 w-full" aria-busy="true" />;

  const onSubmit = async () => {
    // TODO(Phase 3): PATCH /api/v1/organizations/current
    await sleep(700);
    toast.success('Organization settings saved (demo mode)');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-section-title">Organization</CardTitle>
          <CardDescription>Business details shown on your workspace and documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-xl border border-dashed bg-muted text-muted-foreground">
              <Building2 className="size-6" aria-hidden />
            </span>
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => toast.info('Logo upload arrives with file storage in a later phase.')}>
                Upload logo
              </Button>
              <p className="text-caption mt-1">PNG or SVG, up to 2 MB.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="org-name" label="Organization name" error={errors.name?.message}>
              <Input {...fieldA11y('org-name', errors.name?.message)} {...register('name')} />
            </FormField>
            <FormField id="org-email" label="Email" error={errors.email?.message}>
              <Input type="email" {...fieldA11y('org-email', errors.email?.message)} {...register('email')} />
            </FormField>
            <FormField id="org-phone" label="Phone" error={errors.phone?.message}>
              <Input type="tel" {...fieldA11y('org-phone', errors.phone?.message)} {...register('phone')} />
            </FormField>
            <FormField id="org-line1" label="Street address" error={errors.line1?.message}>
              <Input {...fieldA11y('org-line1', errors.line1?.message)} {...register('line1')} />
            </FormField>
            <FormField id="org-city" label="City" error={errors.city?.message}>
              <Input {...fieldA11y('org-city', errors.city?.message)} {...register('city')} />
            </FormField>
            <FormField id="org-state" label="State / region" error={errors.state?.message}>
              <Input {...fieldA11y('org-state', errors.state?.message)} {...register('state')} />
            </FormField>
            <FormField id="org-country" label="Country" error={errors.country?.message}>
              <Input {...fieldA11y('org-country', errors.country?.message)} {...register('country')} />
            </FormField>
            <FormField id="org-postal" label="Postal code" error={errors.postalCode?.message}>
              <Input {...fieldA11y('org-postal', errors.postalCode?.message)} {...register('postalCode')} />
            </FormField>
            <FormField id="org-currency" label="Currency">
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="org-currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField id="org-timezone" label="Timezone">
              <Controller
                control={control}
                name="timezone"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="org-timezone" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <LoadingButton type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </LoadingButton>
        </CardFooter>
      </Card>
    </form>
  );
}