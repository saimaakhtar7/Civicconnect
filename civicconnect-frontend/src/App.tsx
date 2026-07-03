import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";

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
import HomePage from "./pages/citizen/HomePage";
import ReportPage from "./pages/citizen/ReportPage";
import PipelineViewPage from "./pages/citizen/PipelineViewPage";
import IssueDetailPage from "./pages/citizen/IssueDetailPage";
import MapPage from "./pages/citizen/MapPage";
import CommunityPage from "./pages/citizen/CommunityPage";
import ProfilePage from "./pages/citizen/ProfilePage";

// Official Pages

import IssueQueuePage from "./pages/official/IssueQueuePage";
import OfficialIssueDetailPage from "./pages/official/OfficialIssueDetailPage";
import SituationRoomPage from "./pages/official/SituationRoomPage";
import AnalyticsPage from "./pages/official/AnalyticsPage";
import ExecutiveReportPage from "./pages/official/ExecutiveReportPage";
import CommandCenterPage from "./pages/official/CommandCenterPage";
import ExecutivePage from "./pages/official/ExecutivePage";

// Primitives
import { PageLoader } from "./components/ui/PageLoader";

const queryClient = new QueryClient();

export const App: React.FC = () => {
  const { loading } = useAuthStore();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/auth/signin" element={<SignInPage />} />
          <Route path="/auth/signup" element={<SignUpPage />} />

          {/* Secure Routes Guard */}
          <Route element={<AuthGuard />}>
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Citizen Routes */}
            <Route element={<RoleGuard role="citizen" />}>
              <Route path="/" element={<CitizenLayout />}>
                <Route index element={<HomePage />} />
                <Route path="report" element={<ReportPage />} />
                <Route path="report/:id/pipeline" element={<PipelineViewPage />} />
                <Route path="issues/:id" element={<IssueDetailPage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="community" element={<CommunityPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Official / Admin Routes */}
            <Route element={<RoleGuard role={["official", "admin"]} />}>
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
              </Route>
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
