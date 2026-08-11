import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function VerifyOtpPage() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email ?? '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h1>Verify your email</h1>
          <p>We couldn't find an email to verify. Please register or sign in again.</p>
          <p className="auth-switch"><Link to="/register">Back to register</Link></p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp(email, otp);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await resendOtp(email);
      setInfo('A new code has been sent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Verify your email</h1>
        <p>Enter the 6-digit code sent to {email}.</p>
        <label>
          Verification code
          <input
            required
            inputMode="numeric"
            maxLength={6}
            pattern="\d{6}"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        {info && <p className="form-info">{info}</p>}
        <button type="submit" className="btn-primary" disabled={submitting || otp.length !== 6}>
          {submitting ? 'Verifying…' : 'Verify'}
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
