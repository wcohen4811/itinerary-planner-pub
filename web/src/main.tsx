import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ItinerariesList from './pages/ItinerariesList';
import ItineraryDetail from './pages/ItineraryDetail';
import Providers from './pages/Providers';
import Dashboard from './pages/Dashboard';
import ProposalsTab from './pages/ProposalsTab';
import ClientsTab from './pages/ClientsTab';
import Login from './pages/Login';
import AdminPortal from './pages/AdminPortal';
import { AppAuthProvider } from './auth/auth';
import { AuthBridge, RequireAuth, RequireAdmin } from './auth/guards';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/', element: <RequireAuth><Dashboard /></RequireAuth> },
  { path: '/dashboard', element: <RequireAuth><Dashboard /></RequireAuth> },
  { path: '/proposals', element: <RequireAuth><ProposalsTab /></RequireAuth> },
  { path: '/clients', element: <RequireAuth><ClientsTab /></RequireAuth> },
  { path: '/itineraries', element: <RequireAuth><ItinerariesList /></RequireAuth> },
  { path: '/itineraries/:id', element: <RequireAuth><ItineraryDetail /></RequireAuth> },
  { path: '/providers', element: <RequireAdmin><Providers /></RequireAdmin> },
  { path: '/admin', element: <RequireAdmin><AdminPortal /></RequireAdmin> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppAuthProvider>
        <AuthBridge />
        <RouterProvider router={router} />
      </AppAuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
