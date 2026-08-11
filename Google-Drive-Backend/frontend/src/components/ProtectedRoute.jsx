import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const [slow, setSlow] = useState(false);

  // The free-tier backend spins down when idle and can take up to ~50s to
  // wake on the first request — without this, that just looks like a
  // broken/hanging app instead of a cold start.
  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="page-loading">
        <p>Loading…</p>
        {slow && <p className="form-info">The server is waking up from idle — this can take up to a minute on the first visit.</p>}
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
