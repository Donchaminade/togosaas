import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmProvider } from './components/ui/ConfirmDialog';
import SplashScreen, { shouldShowSplash } from './components/ui/SplashScreen';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/Home';
import About from './pages/About';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import CommunityEventDetail from './pages/CommunityEventDetail';
import ReportCommunity from './pages/ReportCommunity';
import ReportTrack from './pages/ReportTrack';
import Contact from './pages/Contact';
import MentionsLegales from './pages/MentionsLegales';
import Login from './pages/Login';
import Register from './pages/Register';
import LeadDashboard from './pages/dashboard/LeadDashboard';
import LeadCommunityEdit from './pages/dashboard/LeadCommunityEdit';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AdminCommunityCreate from './pages/dashboard/AdminCommunityCreate';
import AdminCommunityEdit from './pages/dashboard/AdminCommunityEdit';
import AdminCommunityDetail from './pages/dashboard/AdminCommunityDetail';
import AdminLeadDetail from './pages/dashboard/AdminLeadDetail';
import NotFound from './pages/NotFound';
import { LegacyCommunityEventRedirect, LegacyCommunityRedirect, LegacyCommunityReportRedirect } from './components/LegacyRedirects';

export default function App() {
  const [splashDone, setSplashDone] = useState(() => !shouldShowSplash());

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
          {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
          <BrowserRouter>
            <Routes>
              {/* Site vitrine */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/a-propos" element={<About />} />
                <Route path="/solutions" element={<Communities />} />
                <Route path="/solutions/:id" element={<CommunityDetail />} />
                <Route path="/solutions/:id/evenements/:eventId" element={<CommunityEventDetail />} />
                <Route path="/solutions/:id/signaler" element={<ReportCommunity />} />
                {/* Redirections anciennes URLs */}
                <Route path="/communautes" element={<Navigate to="/solutions" replace />} />
                <Route path="/communautes/:id" element={<LegacyCommunityRedirect />} />
                <Route path="/communautes/:id/evenements/:eventId" element={<LegacyCommunityEventRedirect />} />
                <Route path="/communautes/:id/signaler" element={<LegacyCommunityReportRedirect />} />
                <Route path="/signaler" element={<ReportCommunity />} />
                <Route path="/signaler/suivi" element={<ReportTrack />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Authentification */}
              <Route path="/connexion" element={<Login />} />
              <Route path="/inscription" element={<Register />} />

              {/* Espace lead */}
              <Route
                path="/espace-lead"
                element={
                  <ProtectedRoute>
                    <LeadDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/espace-lead/:section"
                element={
                  <ProtectedRoute>
                    <LeadDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/espace-lead/communautes/nouvelle"
                element={
                  <ProtectedRoute>
                    <LeadCommunityEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/espace-lead/communautes/:id"
                element={
                  <ProtectedRoute>
                    <LeadCommunityEdit />
                  </ProtectedRoute>
                }
              />

              {/* Espace admin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/communautes/nouvelle"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminCommunityCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/communautes/:id/modifier"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminCommunityEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/communautes/:id"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminCommunityDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/leads/:id"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLeadDetail />
                  </ProtectedRoute>
                }
              />

              <Route path="/dashboard" element={<Navigate to="/espace-lead" replace />} />
            </Routes>
          </BrowserRouter>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
