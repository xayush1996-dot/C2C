import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { BookingProvider } from '@/context/BookingContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingModal from '@/components/BookingModal';
import ScrollToHashElement from '@/components/ScrollToHashElement';

// Pages
import HomePage from '@/pages/Home';
import AdminPage from '@/pages/Admin';
import ClientPage from '@/pages/Client';
import LoginPage from '@/pages/Login';
import PrivacyPage from '@/pages/Privacy';
import TermsPage from '@/pages/Terms';
import PremiumVideos from '@/pages/PremiumVideos';
import SanctuaryPage from '@/pages/Sanctuary';

function AppLayout() {
  const [showPreloader, setShowPreloader] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BookingProvider>
      {showPreloader && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'var(--color-bg-base)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          animation: 'fadeOutPreloader 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          animationDelay: '1s'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>
                Confusion <span style={{ color: 'var(--color-accent-gold)' }}>to Clarity</span>
              </span>
            </div>
            <div style={{
              width: '80px',
              height: '1px',
              background: 'var(--color-accent-gold)',
              animation: 'drawWidth 0.8s ease-in-out forwards'
            }} />
            <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
              Transforming Potential
            </span>
          </div>
        </div>
      )}

      <Header />
      <main className="flex-1 flex flex-col pt-20">
        <Outlet />
      </main>
      <Footer />
      <BookingModal />
    </BookingProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToHashElement />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/client" element={<ClientPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/premium-videos" element={<PremiumVideos />} />
          <Route path="/sanctuary" element={<SanctuaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
