import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { DateRangeProvider } from '@/hooks/useDateRange';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminLayout, AffiliateLayout } from '@/components/layout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ResultsPage } from '@/pages/results/ResultsPage';
import { LinksPage } from '@/pages/links/LinksPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AdminRequestsPage } from '@/pages/admin/RequestsPage';
import { AdminAffiliatesPage } from '@/pages/admin/AffiliatesPage';
import { LinksManagementPage } from '@/pages/admin/LinksManagementPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403/404 errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status?: number }).status;
          if (status === 401 || status === 403 || status === 404) {
            return false;
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      retry: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <DateRangeProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Affiliate routes */}
                <Route element={<AffiliateLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/resultados" element={<ResultsPage />} />
                  <Route path="/links" element={<LinksPage />} />
                  <Route path="/configuracoes" element={<SettingsPage />} />
                </Route>

                {/* Admin routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="requests" element={<AdminRequestsPage />} />
                  <Route path="affiliates" element={<AdminAffiliatesPage />} />
                  <Route path="links" element={<LinksManagementPage />} />
                </Route>
              </Routes>
            </DateRangeProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
