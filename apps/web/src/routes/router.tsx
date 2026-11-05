
import { CalendarDays, FileText } from 'lucide-react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AcceptInvitationPage } from '@/features/auth/pages/accept-invitation-page';
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { LeadDetailPage } from '@/features/leads/lead-detail-page';
import { LeadsPage } from '@/features/leads/leads-page';
import { SettingsPage } from '@/features/settings/settings-page';
import { AppLayout } from '@/layouts/app-layout';
import { AuthLayout } from '@/layouts/auth-layout';
import { ActivitiesPage } from '@/pages/activities-page';
import { AnalyticsPage } from '@/pages/analytics-page';
import { ComingSoonPage } from '@/pages/coming-soon-page';
import { ContactsPage } from '@/pages/contacts-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { PipelinePage } from '@/pages/pipeline-page';
import { PropertiesPage } from '@/pages/properties-page';
import { RouteError } from '@/pages/route-error';
import { TasksPage } from '@/pages/tasks-page';
import { TeamPage } from '@/pages/team-page';
import { PublicOnly, RequireAuth } from './guards';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app/dashboard" replace /> },
  {
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
              { path: '/forgot-password', element: <ForgotPasswordPage /> },
            ],
          },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: '/reset-password', element: <ResetPasswordPage /> },
          { path: '/accept-invitation', element: <AcceptInvitationPage /> },
        ],
      },
      {
        path: '/app',
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'leads', element: <LeadsPage /> },
              { path: 'leads/:leadId', element: <LeadDetailPage /> },
              { path: 'contacts', element: <ContactsPage /> },
              { path: 'properties', element: <PropertiesPage /> },
              { path: 'pipeline', element: <PipelinePage /> },
              { path: 'tasks', element: <TasksPage /> },
              {
                path: 'calendar',
                element: (
                  <ComingSoonPage
                    title="Calendar"
                    description="Viewings, meetings and follow-ups in one schedule."
                    icon={CalendarDays}
                    message="A shared calendar with viewing scheduling is planned. For now, due dates live on each task."
                  />
                ),
              },
              { path: 'activities', element: <ActivitiesPage /> },
              { path: 'analytics', element: <AnalyticsPage /> },
              {
                path: 'reports',
                element: (
                  <ComingSoonPage
                    title="Reports"
                    description="Exportable reports for owners and managers."
                    icon={FileText}
                    message="Scheduled and exportable reports are planned after the core CRM modules are complete."
                  />
                ),
              },
              { path: 'team', element: <TeamPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
