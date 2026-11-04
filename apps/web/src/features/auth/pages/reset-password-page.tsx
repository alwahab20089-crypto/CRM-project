import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { FormField, fieldA11y } from '@/components/common/form-field';
import { LoadingButton } from '@/components/common/loading-button';
import { PasswordInput } from '@/components/common/password-input';
import { Button } from '@/components/ui/button';
import { sleep } from '@/lib/utils';
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas';

export function ResetPasswordPage() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async () => {
    // TODO(Phase 3): POST /api/v1/auth/reset-password with the token from the emailed link.
    await sleep(800);
    setDone(true);
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