import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ResetPasswordPage() {
  const { resetPassword, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email ?? '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h1>Reset password</h1>
          <p>We couldn't find an email to reset. Please start from the forgot password page.</p>
          <p className="auth-switch"><Link to="/forgot-password">Forgot password</Link></p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(email, otp, newPassword);
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await forgotPassword(email);
      setInfo('A new reset code has been sent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Reset password</h1>
        <p>Enter the code sent to {email} and choose a new password.</p>
        <label>
          Reset code
          <input
            required
            inputMode="numeric"
            maxLength={6}
            pattern="\d{6}"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        <label>
          New password
          <input type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        {info && <p className="form-info">{info}</p>}
        <button type="submit" className="btn-primary" disabled={submitting || otp.length !== 6}>
          {submitting ? 'Resetting…' : 'Reset password'}
        </button>
        <p className="auth-switch">
          Didn't get a code?{' '}
          <button type="button" className="link-button" onClick={handleResend} disabled={resending}>
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </p>
      </form>
    </div>
  );
}
