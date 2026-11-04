import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { crmService } from '@/services';

export const useCurrentUser = () => useQuery({ queryKey: ['currentUser'], queryFn: () => crmService.getCurrentUser() });
export const useOrganizations = () => useQuery({ queryKey: ['organizations'], queryFn: () => crmService.getOrganizations() });
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

export function useActiveOrganization() {
  const { activeOrganizationId } = useAuth();
  const query = useOrganizations();
  const organization = query.data?.find((o) => o._id === activeOrganizationId) ?? query.data?.[0];
  return { organization, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
}