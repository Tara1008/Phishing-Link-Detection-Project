import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext.tsx';
import Navbar      from './components/layout/Navbar.js';
import Footer      from './components/layout/Footer.tsx';
import LandingPage from './pages/LandingPage.tsx';
import ScanPage    from './pages/ScanPage.tsx';
import HistoryPage from './pages/HistoryPage.tsx';
import TipsPage    from './pages/TipsPage.tsx';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"        element={<LandingPage />} />
              <Route path="/scan"    element={<ScanPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/tips"    element={<TipsPage />} />
            </Routes>
          </main>
          <Footer />
        </div>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--card-bg)',
              color:      'var(--text-primary)',
              border:     '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: 'var(--shadow-lg)',
            },
            duration: 3000,
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}
