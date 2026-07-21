import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BookingFlow from './pages/BookingFlow';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AssistantWidget } from './components/AssistantWidget';
import { ProtectedRoute } from './components/ProtectedRoute';

/** Route changes should land at the top of the page, not mid-scroll. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

/** The widget is the product's front door — hide it only on the staff portal. */
function ChromeAwareWidget() {
  const { pathname } = useLocation();
  if (pathname === '/dashboard' || pathname === '/login') return null;
  return <AssistantWidget />;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/book" element={<BookingFlow />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <ChromeAwareWidget />
    </BrowserRouter>
  );
}

export default App;
