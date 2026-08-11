import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { HomePage } from './pages/HomePage';
import { DrivePage } from './pages/DrivePage';
import { SharedPage } from './pages/SharedPage';
import { RecentPage } from './pages/RecentPage';
import { StarredPage } from './pages/StarredPage';
import { TrashPage } from './pages/TrashPage';
import { StoragePage } from './pages/StoragePage';
import { ActivityPage } from './pages/ActivityPage';
import { useDarkMode } from './hooks/useDarkMode';

function App() {
  // Applies the saved theme to <body> on first load so auth pages (which
  // don't render the Topbar) still respect it, not just pages inside Layout.
  useDarkMode();

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/drive" element={<ProtectedRoute><DrivePage /></ProtectedRoute>} />
          <Route path="/shared" element={<ProtectedRoute><SharedPage /></ProtectedRoute>} />
          <Route path="/recent" element={<ProtectedRoute><RecentPage /></ProtectedRoute>} />
          <Route path="/starred" element={<ProtectedRoute><StarredPage /></ProtectedRoute>} />
          <Route path="/trash" element={<ProtectedRoute><TrashPage /></ProtectedRoute>} />
          <Route path="/storage" element={<ProtectedRoute><StoragePage /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
