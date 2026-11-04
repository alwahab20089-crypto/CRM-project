import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { FormField, fieldA11y } from '@/components/common/form-field';
import { LoadingButton } from '@/components/common/loading-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sleep } from '@/lib/utils';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const onSubmit = async (values: ForgotPasswordValues) => {
    // TODO(Phase 3): POST /api/v1/auth/forgot-password (always respond generically).
    await sleep(700);
    setSentTo(values.email);
  };

  if (sentTo) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-success/10 text-success">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h1 className="text-page-title">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, we have sent a link to reset your password.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild>
            <Link to="/reset-password">Continue to reset (demo)</Link>
          </Button>
          <Button variant="ghost" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-page-title">Forgot your password?</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter your email and we will send you a reset link.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...fieldA11y('email', errors.email?.message)} {...register('email')} />
        </FormField>
        <LoadingButton type="submit" className="w-full" loading={isSubmitting}>
          Send reset link
        </LoadingButton>
      </form>
      <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
    </div>
  );
}