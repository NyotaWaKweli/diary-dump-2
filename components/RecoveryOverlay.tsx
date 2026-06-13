'use client';

import React, { useState, useRef, useEffect } from 'react';
import { styles } from '../styles';

interface Props {
  onVerifyPin: (username: string, recoveryPin: string) => Promise<{ success: boolean; userId?: string; error?: string }>;
  onResetPassword: (userId: string, newPassword: string) => Promise<void>;
  onLogin: () => void;
  onClose: () => void;
}

export default function RecoveryOverlay({ onVerifyPin, onResetPassword, onLogin, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [recoveryPin, setRecoveryPin] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verifiedUserId, setVerifiedUserId] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  function triggerShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }

  function getPasswordStrength(pw: string): { strength: number; label: string; color: string } {
    if (!pw) return { strength: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;

    if (score <= 2) return { strength: 1, label: 'Weak', color: '#e94560' };
    if (score <= 3) return { strength: 2, label: 'Medium', color: '#f5a623' };
    if (score <= 4) return { strength: 3, label: 'Strong', color: '#4caf50' };
    return { strength: 4, label: 'Very Strong', color: '#00cec9' };
  }

  const pwStrength = getPasswordStrength(newPassword);

  function handlePinChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...recoveryPin];
    newPin[index] = value;
    setRecoveryPin(newPin);
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !recoveryPin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  }

  async function handleVerifyPin() {
    const pin = recoveryPin.join('');
    if (!username) { setError('Username is required'); triggerShake(); return; }
    if (!/^\d{4}$/.test(pin)) { setError('Please enter all 4 digits'); triggerShake(); return; }

    setIsLoading(true);
    setError('');
    try {
      const result = await onVerifyPin(username, pin);
      if (result.success && result.userId) {
        setVerifiedUserId(result.userId);
        setStep(2);
      } else {
        setError(result.error || 'Invalid username or PIN');
        triggerShake();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword() {
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); triggerShake(); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); triggerShake(); return; }

    setIsLoading(true);
    setError('');
    try {
      await onResetPassword(verifiedUserId, newPassword);
      setStep(3); // Success
    } catch (err: any) {
      setError(err.message || 'Reset failed');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  }

  const shakeStyle = isShaking ? { animation: 'shake 0.5s ease-in-out' } : {};

  return (
    <div style={styles.overlayScreen}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes successPop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>close</button>
        <h2 style={styles.overlayTitle}>recover account</h2>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#8f7666', letterSpacing: '1px' }}>
          {step < 3 ? `Step ${step} of 2` : 'Complete'}
        </div>
      </div>
      <div style={{ ...styles.overlayBody, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...styles.authCard, ...shakeStyle, maxWidth: '420px' }}>
          <h2 style={styles.authTitle}>diary dump</h2>
          <p style={styles.authSubtitle}>{step === 3 ? 'password reset complete' : 'recover your account'}</p>

          {/* Step indicator */}
          {step < 3 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
              {[1, 2].map((s) => (
                <div key={s} style={{
                  width: '48px',
                  height: '4px',
                  borderRadius: '2px',
                  background: s <= step ? '#c87800' : '#3d332e',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          )}

          {error && (
            <div style={{ 
              background: 'rgba(233, 69, 96, 0.1)', 
              border: '1px solid rgba(233, 69, 96, 0.3)', 
              borderRadius: '2px', 
              padding: '10px 14px', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: '#e94560', fontSize: '14px' }}>⚠</span>
              <span style={{ color: '#e94560', fontSize: '13px' }}>{error}</span>
            </div>
          )}

          {/* STEP 1: Verify Identity */}
          {step === 1 && (
            <div>
              <label style={{ 
                display: 'block', 
                fontFamily: "'JetBrains Mono', monospace", 
                fontSize: '10px', 
                fontWeight: 500, 
                color: '#8f7666', 
                letterSpacing: '1.5px', 
                marginBottom: '8px', 
                textTransform: 'uppercase' 
              }}>
                Step 1: Verify your identity
              </label>

              <input
                ref={usernameRef}
                type="text"
                style={styles.input}
                placeholder="Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value.toLowerCase()); setError(''); }}
                autoComplete="username"
                disabled={isLoading}
              />

              <p style={{ 
                fontSize: '12px', 
                color: '#8f7666', 
                marginBottom: '12px', 
                fontFamily: "'JetBrains Mono', monospace" 
              }}>
                Enter your 4-digit recovery PIN:
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                {recoveryPin.map((digit, index) => (
                  <input
                    key={index}
                    ref={pinRefs[index]}
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    style={{
                      width: '56px',
                      height: '64px',
                      background: '#2a211e',
                      border: `2px solid ${digit ? '#c87800' : '#3d332e'}`,
                      borderRadius: '4px',
                      color: '#ebcfbc',
                      fontSize: '24px',
                      fontFamily: "'JetBrains Mono', monospace",
                      textAlign: 'center',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    disabled={isLoading}
                  />
                ))}
              </div>

              <button 
                style={{ 
                  ...styles.btnPrimary, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }} 
                onClick={handleVerifyPin}
                disabled={isLoading}
              >
                {isLoading && (
                  <span style={{ 
                    display: 'inline-block', 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTopColor: '#fff', 
                    borderRadius: '50%', 
                    animation: 'spin 0.8s linear infinite' 
                  }} />
                )}
                {isLoading ? 'Verifying...' : 'Verify PIN'}
              </button>
            </div>
          )}

          {/* STEP 2: Reset Password */}
          {step === 2 && (
            <div>
              <label style={{ 
                display: 'block', 
                fontFamily: "'JetBrains Mono', monospace", 
                fontSize: '10px', 
                fontWeight: 500, 
                color: '#8f7666', 
                letterSpacing: '1.5px', 
                marginBottom: '8px', 
                textTransform: 'uppercase' 
              }}>
                Step 2: Set new password
              </label>

              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...styles.input, marginBottom: 0, paddingRight: '40px' }}
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8f7666',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '4px',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password strength */}
              {newPassword && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4].map((level) => (
                      <div key={level} style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        background: level <= pwStrength.strength ? pwStrength.color : '#3d332e',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: pwStrength.color, fontFamily: "'JetBrains Mono', monospace" }}>
                    {pwStrength.label}
                  </p>
                </div>
              )}

              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  style={{ ...styles.input, marginBottom: 0, paddingRight: '40px', borderColor: confirmPassword && newPassword !== confirmPassword ? '#e94560' : '#3d332e' }}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8f7666',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '4px',
                  }}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ color: '#e94560', fontSize: '12px', marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
                  Passwords do not match
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p style={{ color: '#4caf50', fontSize: '12px', marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
                  ✓ Passwords match
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{ ...styles.btnSecondary, flex: 1 }} 
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button 
                  style={{ 
                    ...styles.btnPrimary, 
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }} 
                  onClick={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <span style={{ 
                      display: 'inline-block', 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderTopColor: '#fff', 
                      borderRadius: '50%', 
                      animation: 'spin 0.8s linear infinite' 
                    }} />
                  )}
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <div style={{ textAlign: 'center', animation: 'successPop 0.5s ease-out' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(76, 175, 80, 0.1)',
                border: '2px solid #4caf50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '32px',
              }}>
                ✓
              </div>
              <h3 style={{ fontFamily: "'Libre Bodoni', Georgia, serif", fontSize: '20px', color: '#ebcfbc', marginBottom: '8px' }}>
                Password Reset Complete
              </h3>
              <p style={{ fontSize: '13px', color: '#8f7666', marginBottom: '24px', fontFamily: "'JetBrains Mono', monospace" }}>
                Your password has been updated. You can now log in with your new password.
              </p>
              <button style={styles.btnPrimary} onClick={onLogin}>
                Go to Login
              </button>
            </div>
          )}

          {step < 3 && (
            <div style={styles.authLink}>
              Remember your password? <button type="button" style={styles.authLinkBtn} onClick={onLogin}>Log In</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
