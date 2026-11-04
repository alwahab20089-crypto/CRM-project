import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FormField, fieldA11y } from '@/components/common/form-field';
import { LoadingButton } from '@/components/common/loading-button';
import { PasswordInput } from '@/components/common/password-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sleep } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { registerSchema, type RegisterValues } from '../schemas';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', organizationName: '', password: '', confirmPassword: '', terms: false },
  });

  const onSubmit = async () => {
    // TODO(Phase 3): POST /api/v1/auth/register (creates user + organization + trial).
    await sleep(900);
    signIn(false);
    toast.success('Account created (demo mode)');
    navigate('/app/dashboard', { replace: true });
  };

  return (
    <div>
      <h1 className="text-page-title">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Start managing leads and listings in minutes.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <FormField id="name" label="Full name" error={errors.name?.message}>
          <Input autoComplete="name" {...fieldA11y('name', errors.name?.message)} {...register('name')} />
        </FormField>
        <FormField id="email" label="Work email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...fieldA11y('email', errors.email?.message)} {...register('email')} />
        </FormField>
        <FormField id="organizationName" label="Organization / business name" error={errors.organizationName?.message}>
          <Input autoComplete="organization" {...fieldA11y('organizationName', errors.organizationName?.message)} {...register('organizationName')} />
        </FormField>
        <FormField id="password" label="Password" hint="At least 10 characters." error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" {...fieldA11y('password', errors.password?.message)} {...register('password')} />
        </FormField>
        <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...fieldA11y('confirmPassword', errors.confirmPassword?.message)} {...register('confirmPassword')} />
        </FormField>

        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <Controller
              control={control}
              name="terms"
              render={({ field }) => (
                <Checkbox
                  id="terms"
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  aria-invalid={errors.terms ? true : undefined}
                  aria-describedby={errors.terms ? 'terms-error' : undefined}
                />
              )}
            />
            <Label htmlFor="terms" className="leading-snug font-normal">
              I agree to the Terms and Conditions and Privacy Policy.
            </Label>
          </div>
          {errors.terms && (
            <p id="terms-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.terms.message}
            </p>
          )}
        </div>

        <LoadingButton type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </LoadingButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}