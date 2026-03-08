import 'primeicons/primeicons.css';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Routes, Route } from 'react-router-dom';
import './App.css';

import { AuthContext } from './contexts/AuthContext';
import { StoreContext } from './contexts/StoreContext';
import { useAuth } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';

import { Navbar } from './components/layout/Navbar';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProjectList } from './components/projects/ProjectList';
import { ProjectDetail } from './components/projects/ProjectDetail';
import { ProfilePage } from './components/profile/ProfilePage';
import { BookmarksPage } from './components/bookmarks/BookmarksPage';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';

function App() {
  const auth = useAuth();
  const projectFeatures = useProjects(auth.user);

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner message="Initializing..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={auth}>
        <StoreContext.Provider value={projectFeatures}>
          <Navbar />
          <Routes>
            {/* Dashboard with left/right sidebars */}
            <Route element={<DashboardLayout />}>
              <Route index element={<ProjectList />} />
            </Route>

            {/* Full-width pages */}
            <Route path="/project/:projectId" element={<ProjectDetail />} />
            <Route
              path="/project/:projectId/analytics"
              element={<AnalyticsDashboard />}
            />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
          </Routes>

          <ConfirmDialog />
        </StoreContext.Provider>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
