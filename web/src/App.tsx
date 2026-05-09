import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.startsWith('/dashboard');
  if (isDashboard) {
    return <Outlet />;
  }
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="text-lg font-semibold">Itinerary Planner</h1>
        <nav className="nav">
          <button
            className={location.pathname.startsWith('/itineraries') || location.pathname === '/' ? 'active' : ''}
            onClick={() => navigate('/itineraries')}
          >
            Itineraries
          </button>
          <button className={location.pathname.startsWith('/providers') ? 'active' : ''} onClick={() => navigate('/providers')}>
            Providers & Destinations
          </button>
          <button className={location.pathname.startsWith('/dashboard') ? 'active' : ''} onClick={() => navigate('/dashboard')}>
            Dashboard (CRM)
          </button>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
