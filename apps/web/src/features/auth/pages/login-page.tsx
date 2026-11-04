import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FormField, fieldA11y } from '@/components/common/form-field';
import { LoadingButton } from '@/components/common/loading-button';
import { PasswordInput } from '@/components/common/password-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sleep } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { loginSchema, type LoginValues } from '../schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (values: LoginValues) => {
    // TODO(Phase 3): POST /api/v1/auth/login. Mock only: any valid email/password signs in.
    await sleep(700);
    signIn(values.remember);
    toast.success('Signed in (demo mode)');
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from ?? '/app/dashboard', { replace: true });
  };

  return (
    <div>
      <h1 className="text-page-title">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your EstateFlow workspace.</p>
      <p className="mt-4 rounded-md bg-info/10 px-3 py-2 text-xs text-info">
        Demo mode: any valid email and a password sign you in. No real authentication yet.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="you@company.com" {...fieldA11y('email', errors.email?.message)} {...register('email')} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...fieldA11y('password', errors.password?.message)} {...register('password')} />
        </FormField>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="remember"
              render={({ field }) => (
                <Checkbox id="remember" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              )}
            />
            <Label htmlFor="remember" className="font-normal">
              Remember me
            </Label>
          </div>
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <LoadingButton type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </LoadingButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to EstateFlow?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}