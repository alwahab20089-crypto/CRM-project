import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { FormField, fieldA11y } from '@/components/common/form-field';
import { LoadingButton } from '@/components/common/loading-button';
import { PasswordInput } from '@/components/common/password-input';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { authService } from '@/services/auth-service';
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <ErrorState
        title="Reset link invalid"
        message="This password reset link is missing or incomplete. Request a new one."
        retryLabel="Request a new link"
        onRetry={() => window.location.assign('/forgot-password')}
      />
    );
  }

  const onSubmit = async (values: ResetPasswordValues) => {
    setServerError(null);
    try {
      await authService.resetPassword(token, values.password);
      setDone(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-success/10 text-success">
          <CircleCheck className="size-6" aria-hidden />
        </span>
        <h1 className="text-page-title">Password updated</h1>
        <p className="mt-2 text-sm text-muted-foreground">You can now sign in with your new password.</p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-page-title">Set a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose a strong password you have not used before.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {serverError && (
          <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}
        <FormField id="password" label="New password" hint="At least 10 characters." error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" {...fieldA11y('password', errors.password?.message)} {...register('password')} />
        </FormField>
        <FormField id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...fieldA11y('confirmPassword', errors.confirmPassword?.message)} {...register('confirmPassword')} />
        </FormField>
        <LoadingButton type="submit" className="w-full" loading={isSubmitting}>
          Update password
        </LoadingButton>
      </form>
    </div>
  );
}