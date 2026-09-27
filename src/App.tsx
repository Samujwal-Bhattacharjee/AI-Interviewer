import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AtmosphericBackground } from './components/layout/AtmosphericBackground';
import { NavBar } from './components/layout/NavBar';
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { StudentDashboardPage } from './features/student/StudentDashboardPage';
import { FacultyDashboardPage } from './features/faculty/FacultyDashboardPage';
import { AssessmentPage } from './features/assessment/AssessmentPage';
import { InterviewPage } from './features/interview/InterviewPage';
import { SkillsPage } from './features/skills/SkillsPage';
import { ReportPage } from './features/report/ReportPage';
import { PlanPage, ReassessPage } from './features/shells/ShellPages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AtmosphericBackground />
          <NavBar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty"
              element={
                <ProtectedRoute requiredRole="faculty">
                  <FacultyDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/assess" element={<AssessmentPage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/reassess" element={<ReassessPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
