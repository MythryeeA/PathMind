import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { TrackPickerPage } from './pages/TrackPickerPage';
import { PracticePage } from './pages/PracticePage';
import { DashboardPage } from './pages/DashboardPage';
import { EvalPage } from './pages/EvalPage';

export const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Main Core Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/tracks" element={<TrackPickerPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/diagnostic" element={<PracticePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/eval" element={<EvalPage />} />
          <Route path="/eval/report" element={<EvalPage />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
