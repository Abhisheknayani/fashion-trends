import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Smartphone,
  ArrowRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

import { api } from '../services/api';
import './AdminLogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sendOtp = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    const cleanMobile = mobile.trim();

    if (!/^\d{10,20}$/.test(cleanMobile)) {
      setError('Please enter a valid mobile number.');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        '/auth/admin/login/request-otp',
        {
          mobile: cleanMobile
        }
      );

      setOtpSent(true);

      setMessage(
        response.data?.message ||
        'OTP sent to your mobile number.'
      );

      // Development mode only
      if (response.data?.devOtp) {
        console.log(
          'Development Admin OTP:',
          response.data.devOtp
        );
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    const cleanMobile = mobile.trim();
    const cleanOtp = otp.trim();

    if (!/^\d{10,20}$/.test(cleanMobile)) {
      setError('Please enter a valid mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('OTP must be exactly 6 digits.');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        '/auth/admin/login/verify',
        {
          mobile: cleanMobile,
          otp: cleanOtp
        }
      );

      const { token, admin } = response.data;

      if (!token || !admin) {
        setError('Invalid server response.');
        return;
      }

      // Admin authentication
      localStorage.setItem(
        'ft_token',
        token
      );

      localStorage.setItem(
        'ft_admin',
        JSON.stringify(admin)
      );

      // Clear customer authentication
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      navigate('/admin', {
        replace: true
      });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Invalid or expired OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const changeMobile = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
    setMessage('');
  };

  return (
    <div className="admin-login-page">

      <div className="admin-login-background">
        <div className="admin-bg-shape admin-bg-shape-one" />
        <div className="admin-bg-shape admin-bg-shape-two" />
        <div className="admin-bg-grid" />
      </div>

      <main className="admin-login-container">

        <section className="admin-login-card">

          {/* Logo */}
          <div className="admin-login-logo">
            <div className="admin-logo-icon">
              <ShieldCheck size={28} strokeWidth={2.2} />
            </div>

            <div className="admin-logo-text">
              <strong>FASHION</strong>
              <span>TRENDS</span>
            </div>
          </div>

          {/* Heading */}
          <div className="admin-login-heading">
            <div className="admin-badge">
              <ShieldCheck size={14} />
              ADMIN CONTROL CENTER
            </div>

            <h1>Welcome back</h1>

            <p>
              Manage catalog, customers, orders,
              inventory, payments and operations.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="admin-alert admin-alert-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="admin-alert admin-alert-success">
              <CheckCircle2 size={18} />
              <p>{message}</p>
            </div>
          )}

          {!otpSent ? (

            /* ==================================================
               MOBILE FORM
            ================================================== */

            <form
              className="admin-login-form"
              onSubmit={sendOtp}
            >

              <div className="admin-field">

                <label htmlFor="admin-mobile">
                  Mobile number
                </label>

                <div className="admin-input-wrapper">

                  <Smartphone
                    className="admin-input-icon"
                    size={19}
                  />

                  <input
                    id="admin-mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="Enter admin mobile number"
                    value={mobile}
                    onChange={(e) => {
                      const value =
                        e.target.value.replace(/\D/g, '');

                      setMobile(value);
                    }}
                    maxLength={20}
                    disabled={loading}
                  />

                </div>

              </div>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="admin-spinner" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

            </form>

          ) : (

            /* ==================================================
               OTP FORM
            ================================================== */

            <form
              className="admin-login-form"
              onSubmit={verifyOtp}
            >

              <div className="admin-mobile-summary">

                <div className="admin-mobile-icon">
                  <Smartphone size={20} />
                </div>

                <div>
                  <span>OTP sent to</span>
                  <strong>
                    +91 {mobile}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={changeMobile}
                  disabled={loading}
                >
                  Change
                </button>

              </div>

              <div className="admin-field">

                <label htmlFor="admin-otp">
                  Enter OTP
                </label>

                <div className="admin-input-wrapper">

                  <ShieldCheck
                    className="admin-input-icon"
                    size={19}
                  />

                  <input
                    id="admin-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      const value =
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6);

                      setOtp(value);
                    }}
                    maxLength={6}
                    autoFocus
                    disabled={loading}
                  />

                </div>

              </div>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={
                  loading ||
                  otp.length !== 6
                }
              >
                {loading ? (
                  <>
                    <span className="admin-spinner" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="admin-resend-button"
                onClick={sendOtp}
                disabled={loading}
              >
                <RefreshCw size={16} />
                Resend OTP
              </button>

            </form>

          )}

          {/* Footer */}
          <div className="admin-login-footer">

            <div className="admin-security-note">
              <ShieldCheck size={16} />
              <span>
                Secure administrator authentication
              </span>
            </div>

            <span className="admin-login-version">
              Fashion Trends Admin
            </span>

          </div>

        </section>

      </main>

    </div>
  );
}