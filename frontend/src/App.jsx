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

function AppLayout() {
  return (
    <BookingProvider>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
