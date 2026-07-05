import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { useAuth } from "./hooks/useAuth";

// Layouts
import CitizenLayout from "./components/layout/CitizenLayout";
import OfficialLayout from "./components/layout/OfficialLayout";

// Guards
import AuthGuard from "./components/auth/AuthGuard";
import RoleGuard from "./components/auth/RoleGuard";

// Auth Pages
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import OnboardingPage from "./pages/auth/OnboardingPage";
import LandingPage from "./pages/LandingPage";

// Citizen Pages
const HomePage = React.lazy(() => import("./pages/citizen/HomePage"));
const ReportPage = React.lazy(() => import("./pages/citizen/ReportPage"));
const PipelineViewPage = React.lazy(() => import("./pages/citizen/PipelineViewPage"));
const IssueDetailPage = React.lazy(() => import("./pages/citizen/IssueDetailPage"));
const MapPage = React.lazy(() => import("./pages/citizen/MapPage"));
const CommunityPage = React.lazy(() => import("./pages/citizen/CommunityPage"));
const ProfilePage = React.lazy(() => import("./pages/citizen/ProfilePage"));
const EventsPage = React.lazy(() => import("./pages/citizen/EventsPage"));

// Official Pages
const IssueQueuePage = React.lazy(() => import("./pages/official/IssueQueuePage"));
const OfficialIssueDetailPage = React.lazy(() => import("./pages/official/OfficialIssueDetailPage"));
const SituationRoomPage = React.lazy(() => import("./pages/official/SituationRoomPage"));
const AnalyticsPage = React.lazy(() => import("./pages/official/AnalyticsPage"));
const ExecutiveReportPage = React.lazy(() => import("./pages/official/ExecutiveReportPage"));
const CommandCenterPage = React.lazy(() => import("./pages/official/CommandCenterPage"));
const ExecutivePage = React.lazy(() => import("./pages/official/ExecutivePage"));
const SettingsPage = React.lazy(() => import("./pages/official/SettingsPage"));
const ModeratorDashboardPage = React.lazy(() => import("./pages/official/ModeratorDashboardPage"));

// Admin Pages
const AdminDashboardPage = React.lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = React.lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminDepartmentsPage = React.lazy(() => import("./pages/admin/AdminDepartmentsPage"));
const AdminCategoriesPage = React.lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminAnalyticsPage = React.lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const AdminSettingsPage = React.lazy(() => import("./pages/admin/AdminSettingsPage"));

// Primitives
import { PageLoader } from "./components/ui/PageLoader";

const queryClient = new QueryClient();

export const App: React.FC = () => {
  useAuth();
  const { loading } = useAuthStore();

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("settings_themeMode") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const handleSettingsUpdate = () => {
      const activeTheme = localStorage.getItem("settings_themeMode") || "dark";
      document.documentElement.setAttribute("data-theme", activeTheme);
    };
    window.addEventListener("settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("settings-updated", handleSettingsUpdate);
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <React.Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public homepage */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="/auth/signin" element={<SignInPage />} />
            <Route path="/auth/signup" element={<SignUpPage />} />

            {/* Secure Routes Guard for Onboarding */}
            <Route element={<AuthGuard />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>

            {/* Citizen Layout: Both Public (Visitor) and Private (Citizen) Routes */}
            <Route path="/app" element={<CitizenLayout />}>
              {/* Public Citizen Pages (Visitor Accessible) */}
              <Route index element={<HomePage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="issues/:id" element={<IssueDetailPage />} />

              {/* Private Citizen Pages (Authenticated Citizens Only) */}
              <Route element={<AuthGuard />}>
                <Route element={<RoleGuard role="citizen" />}>
                  <Route path="report" element={<ReportPage />} />
                  <Route path="report/:id/pipeline" element={<PipelineViewPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>
            </Route>

            {/* Official / Admin / Moderator Routes */}
            <Route element={<AuthGuard />}>
              <Route element={<RoleGuard role={["official", "admin", "moderator"]} />}>
                <Route path="/dashboard" element={<OfficialLayout />}>
                  <Route index element={<Navigate to="/dashboard/command-center" replace />} />
                  <Route path="command-center" element={<CommandCenterPage />} />
                  <Route path="issues" element={<IssueQueuePage />} />
                  <Route path="issues/:id" element={<OfficialIssueDetailPage />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="situation-room" element={<SituationRoomPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="executive-report" element={<ExecutiveReportPage />} />
                  <Route path="executive" element={<ExecutivePage />} />
                  <Route path="moderator" element={<ModeratorDashboardPage />} />
                  <Route path="settings" element={<SettingsPage />} />

                  {/* Admin Specific Routes */}
                  <Route element={<RoleGuard role="admin" />}>
                    <Route path="admin" element={<AdminDashboardPage />} />
                    <Route path="admin/users" element={<AdminUsersPage />} />
                    <Route path="admin/departments" element={<AdminDepartmentsPage />} />
                    <Route path="admin/categories" element={<AdminCategoriesPage />} />
                    <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
                    <Route path="admin/settings" element={<AdminSettingsPage />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
