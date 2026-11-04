import { zodResolver } from '@hookform/resolvers/zod';
import { MailOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ErrorState } from '@/components/common/error-state';
import { FormField, fieldA11y } from '@/components/common/form-field';
import { LoadingButton } from '@/components/common/loading-button';
import { PasswordInput } from '@/components/common/password-input';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvitationPreview } from '@/hooks/use-crm-queries';
import { roleLabels } from '@/lib/labels';
import { sleep } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { acceptInvitationSchema, type AcceptInvitationValues } from '../schemas';

export function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? 'demo';
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { data: invite, isLoading, isError, refetch } = useInvitationPreview(token);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { name: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async () => {
    // TODO(Phase 3): POST /api/v1/members/invitations/accept with the invitation token.
    await sleep(800);
    signIn(false);
    toast.success('Invitation accepted (demo mode)');
    navigate('/app/dashboard', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading invitation">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (isError || !invite) {
    return <ErrorState title="Invitation unavailable" message="This invitation is invalid or has expired." onRetry={() => refetch()} />;
  }

  return (
    <div>
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-brand/15 text-foreground">
        <MailOpen className="size-6" aria-hidden />
      </span>
      <h1 className="text-page-title">Join {invite.organizationName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {invite.invitedByName} invited <span className="font-medium text-foreground">{invite.email}</span> to join as{' '}
        <span className="font-medium text-foreground">{roleLabels[invite.role]}</span>.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <FormField id="name" label="Full name" error={errors.name?.message}>
          <Input autoComplete="name" {...fieldA11y('name', errors.name?.message)} {...register('name')} />
        </FormField>
        <FormField id="password" label="Create a password" hint="At least 10 characters." error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" {...fieldA11y('password', errors.password?.message)} {...register('password')} />
        </FormField>
        <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...fieldA11y('confirmPassword', errors.confirmPassword?.message)} {...register('confirmPassword')} />
        </FormField>
        <LoadingButton type="submit" className="w-full" loading={isSubmitting}>
          Accept invitation
        </LoadingButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Not for you?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Decline and go to sign in
        </Link>
      </p>
    </div>
  );
}