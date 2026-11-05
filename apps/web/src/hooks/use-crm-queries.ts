import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { crmService } from '@/services';

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: () => crmService.getDashboard() });
export const useLeads = () => useQuery({ queryKey: ['leads'], queryFn: () => crmService.getLeads() });
export const useContacts = () => useQuery({ queryKey: ['contacts'], queryFn: () => crmService.getContacts() });
export const useProperties = () => useQuery({ queryKey: ['properties'], queryFn: () => crmService.getProperties() });
export const useTasks = () => useQuery({ queryKey: ['tasks'], queryFn: () => crmService.getTasks() });
export const useFollowUps = () => useQuery({ queryKey: ['followUps'], queryFn: () => crmService.getFollowUps() });
export const useActivities = () => useQuery({ queryKey: ['activities'], queryFn: () => crmService.getActivities() });
export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: () => crmService.getNotifications() });
export const useTeam = () => useQuery({ queryKey: ['team'], queryFn: () => crmService.getTeam() });
export const usePlans = () => useQuery({ queryKey: ['plans'], queryFn: () => crmService.getPlans() });
export const useSubscriptionOverview = () =>
  useQuery({ queryKey: ['subscription'], queryFn: () => crmService.getSubscriptionOverview() });
export const useInvitationPreview = (token: string) =>
  useQuery({ queryKey: ['invitation', token], queryFn: () => crmService.getInvitationPreview(token) });

// Identity and organizations now come from the real session (see AuthProvider).
export function useCurrentUser() {
  const { user, status } = useAuth();
  return { data: user ?? undefined, isLoading: status === 'loading' };
}

export function useActiveOrganization() {
  const { activeMembership, status } = useAuth();
  return {
    organization: activeMembership?.organization,
    isLoading: status === 'loading',
    isError: false,
    refetch: () => undefined,
  };
}