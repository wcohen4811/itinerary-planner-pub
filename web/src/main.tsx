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

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />,
  },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/proposals', element: <ProposalsTab /> },
  { path: '/clients', element: <ClientsTab /> },
  { path: '/itineraries', element: <ItinerariesList /> },
  { path: '/itineraries/:id', element: <ItineraryDetail /> },
  { path: '/providers', element: <Providers /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
