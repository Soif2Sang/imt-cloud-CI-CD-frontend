import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { PipelineDetail } from './pages/PipelineDetail';
import { NewProject } from './pages/NewProject';
import { ProjectSettings } from './pages/ProjectSettings/ProjectSettings';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { RequireAuth } from './components/RequireAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            <Route element={<RequireAuth />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Projects />} />
                <Route path="new" element={<NewProject />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="projects/:id/settings" element={<ProjectSettings />} />
                <Route path="projects/:projectId/pipelines/:pipelineId" element={<PipelineDetail />} />
                {/* Catch all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;