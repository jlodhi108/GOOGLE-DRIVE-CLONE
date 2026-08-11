import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { tokenStore } from '../api/client';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!tokenStore.getToken()) {
      setUser(null);
      return;
    }
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    tokenStore.setTokens(res.token, res.refreshToken);
    await refreshUser();
  };

  const register = async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    return res.email;
  };

  const verifyOtp = async (email, otp) => {
    const res = await authApi.verifyOtp(email, otp);
    tokenStore.setTokens(res.token, res.refreshToken);
    await refreshUser();
  };

  const resendOtp = async (email) => {
    await authApi.resendOtp(email);
  };

  const forgotPassword = async (email) => {
    await authApi.forgotPassword(email);
  };

  const resetPassword = async (email, otp, newPassword) => {
    await authApi.resetPassword(email, otp, newPassword);
  };

  const logout = async () => {
    // Revoke the token server-side in the background — must be called
    // before tokenStore.clear() since it reads the current token, but we
    // don't await it: logging out should feel instant on the client even
    // if the backend is slow to respond or unreachable (e.g. a cold-started
    // free-tier server), and a failed revocation shouldn't block the user
    // from ending their local session.
    authApi.logout().catch(() => {});
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, resendOtp, forgotPassword, resetPassword, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
