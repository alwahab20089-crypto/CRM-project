import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormField, fieldA11y } from '@/components/common/form-field';
import { LoadingButton } from '@/components/common/loading-button';
import { PasswordInput } from '@/components/common/password-input';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-crm-queries';
import { sleep } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(100),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().trim().max(30).optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(10, 'Use at least 10 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type PasswordValues = z.infer<typeof passwordSchema>;

function ProfileForm() {
  const { data: user } = useCurrentUser();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: user ? { name: user.name, email: user.email, phone: user.phone ?? '' } : undefined,
  });

  if (!user) return <Skeleton className="h-72 w-full" aria-busy="true" />;

  const onSubmit = async () => {
    // TODO(Phase 3): PATCH /api/v1/users/me
    await sleep(600);
    toast.success('Profile saved (demo mode)');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-section-title">Profile</CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <UserAvatar name={user.name} className="size-16 text-lg" />
            <Button type="button" variant="outline" size="sm" onClick={() => toast.info('Avatar upload arrives with file storage in a later phase.')}>
              Change avatar
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="profile-name" label="Full name" error={errors.name?.message}>
              <Input {...fieldA11y('profile-name', errors.name?.message)} {...register('name')} />
            </FormField>
            <FormField id="profile-email" label="Email" error={errors.email?.message}>
              <Input type="email" {...fieldA11y('profile-email', errors.email?.message)} {...register('email')} />
            </FormField>
            <FormField id="profile-phone" label="Phone" error={errors.phone?.message}>
              <Input type="tel" {...fieldA11y('profile-phone', errors.phone?.message)} {...register('phone')} />
            </FormField>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <LoadingButton type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save profile
          </LoadingButton>
        </CardFooter>
      </Card>
    </form>
  );
}

function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async () => {
    // TODO(Phase 3): POST /api/v1/users/me/change-password. Passwords are never stored client-side.
    await sleep(700);
    reset();
    toast.success('Password changed (demo mode)');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-section-title">Change password</CardTitle>
          <CardDescription>Use a strong password you do not use elsewhere.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField id="current-password" label="Current password" error={errors.currentPassword?.message} className="sm:col-span-2">
            <PasswordInput autoComplete="current-password" {...fieldA11y('current-password', errors.currentPassword?.message)} {...register('currentPassword')} />
          </FormField>
          <FormField id="new-password" label="New password" error={errors.newPassword?.message}>
            <PasswordInput autoComplete="new-password" {...fieldA11y('new-password', errors.newPassword?.message)} {...register('newPassword')} />
          </FormField>
          <FormField id="confirm-new-password" label="Confirm new password" error={errors.confirmPassword?.message}>
            <PasswordInput autoComplete="new-password" {...fieldA11y('confirm-new-password', errors.confirmPassword?.message)} {...register('confirmPassword')} />
          </FormField>
        </CardContent>
        <CardFooter className="justify-end">
          <LoadingButton type="submit" loading={isSubmitting}>
            Update password
          </LoadingButton>
        </CardFooter>
      </Card>
    </form>
  );
}

export function ProfileSettings() {
  return (
    <div className="space-y-6">
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}