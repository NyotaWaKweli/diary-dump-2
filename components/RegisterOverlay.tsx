'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { styles } from '../styles';

interface Props {
  onRegister: (username: string, password: string, recoveryPin: string) => void;
  onCheckUsername: (username: string) => Promise<{ available: boolean; error?: string }>;
  onLogin: () => void;
  onClose: () => void;
}

export default function RegisterOverlay({ onRegister, onCheckUsername, onLogin, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // Debounced username check
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!username) {
      setUsernameStatus('idle');
      setUsernameError('');
      return;
    }

    // Frontend validation first
    if (!/^[a-z0-9._]+$/.test(username)) {
      setUsernameStatus('invalid');
      setUsernameError('Only lowercase letters, numbers, dots, underscores');
      return;
    }
    if (username.length < 3) {
      setUsernameStatus('invalid');
      setUsernameError('At least 3 characters');
      return;
    }
    if (username.length > 30) {
      setUsernameStatus('invalid');
      setUsernameError('At most 30 characters');
      return;
    }
    if (username.startsWith('.') || username.startsWith('_')) {
      setUsernameStatus('invalid');
      setUsernameError('Cannot start with . or _');
      return;
    }
    if (username.endsWith('.') || username.endsWith('_')) {
      setUsernameStatus('invalid');
      setUsernameError('Cannot end with . or _');
      return;
    }
    if (username.includes('..')) {
      setUsernameStatus('invalid');
      setUsernameError('No consecutive dots');
      return;
    }
    if (username.includes('__')) {
      setUsernameStatus('invalid');
      setUsernameError('No consecutive underscores');
      return;
    }

    setUsernameStatus('checking');
    setUsernameError('');

    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await onCheckUsername(username);
        if (result.available) {
          setUsernameStatus('available');
          setUsernameError('');
        } else {
          setUsernameStatus('taken');
          setUsernameError(result.error || 'Username is taken');
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [username, onCheckUsername]);

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

  const pwStrength = getPasswordStrength(password);

  function canProceedStep1(): boolean {
    return usernameStatus === 'available' && username.length >= 3;
  }

  function canProceedStep2(): boolean {
    return password.length >= 8 && password === confirmPassword;
  }

  function handleNextStep() {
    setError('');
    if (step === 1) {
      if (!canProceedStep1()) { triggerShake(); return; }
      setStep(2);
    } else if (step === 2) {
      if (!canProceedStep2()) { triggerShake(); return; }
      setStep(3);
      // Focus first PIN box
      setTimeout(() => pinRefs[0].current?.focus(), 100);
    }
  }

  function handlePinChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...recoveryPin];
    newPin[index] = value;
    setRecoveryPin(newPin);

    // Auto-focus next box
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !recoveryPin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  }

  async function handleSubmit() {
    const pin = recoveryPin.join('');
    if (!/^\d{4}$/.test(pin)) {
      setError('Please enter all 4 digits');
      triggerShake();
      return;
    }

    setIsLoading(true);
    try {
      await onRegister(username, password, pin);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>close</button>
        <h2 style={styles.overlayTitle}>register</h2>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#8f7666', letterSpacing: '1px' }}>
          Step {step} of 3
        </div>
      </div>
      <div style={{ ...styles.overlayBody, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...styles.authCard, ...shakeStyle, maxWidth: '420px' }}>
          <h2 style={styles.authTitle}>diary dump</h2>
          <p style={styles.authSubtitle}>create your account</p>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                width: '32px',
                height: '4px',
                borderRadius: '2px',
                background: s <= step ? '#c87800' : '#3d332e',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

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

          {/* STEP 1: Username */}
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
                Choose your username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={usernameRef}
                  type="text"
                  style={{ 
                    ...styles.input, 
                    borderColor: usernameStatus === 'invalid' || usernameStatus === 'taken' ? '#e94560' : 
                                  usernameStatus === 'available' ? '#4caf50' : '#3d332e',
                    paddingRight: '40px'
                  }}
                  placeholder="e.g., midnight.writer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  autoComplete="username"
                  disabled={isLoading}
                />
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '16px',
                }}>
                  {usernameStatus === 'checking' && (
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #3d332e', borderTopColor: '#c87800', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  )}
                  {usernameStatus === 'available' && <span style={{ color: '#4caf50' }}>✓</span>}
                  {usernameStatus === 'taken' && <span style={{ color: '#e94560' }}>✕</span>}
                  {usernameStatus === 'invalid' && <span style={{ color: '#e94560' }}>!</span>}
                </div>
              </div>

              {usernameError && (
                <p style={{ color: '#e94560', fontSize: '12px', marginTop: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
                  {usernameError}
                </p>
              )}
              {usernameStatus === 'available' && (
                <p style={{ color: '#4caf50', fontSize: '12px', marginTop: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
                  ✓ Username is available
                </p>
              )}

              <div style={{ marginTop: '12px', padding: '10px', background: '#2a211e', borderRadius: '2px', border: '1px solid #3d332e' }}>
                <p style={{ fontSize: '11px', color: '#8f7666', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                  Rules: 3-30 chars, lowercase letters, numbers, dots, underscores. No consecutive dots/underscores. Cannot start/end with . or _
                </p>
              </div>

              <button 
                style={{ 
                  ...styles.btnPrimary, 
                  marginTop: '20px',
                  opacity: !canProceedStep1() ? 0.5 : 1,
                  cursor: !canProceedStep1() ? 'not-allowed' : 'pointer'
                }} 
                onClick={handleNextStep}
                disabled={!canProceedStep1()}
              >
                Next →
              </button>
            </div>
          )}

          {/* STEP 2: Password */}
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
                Create a password
              </label>

              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...styles.input, marginBottom: 0, paddingRight: '40px' }}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              {/* Password strength indicator */}
              {password && (
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
                  style={{ ...styles.input, marginBottom: 0, paddingRight: '40px', borderColor: confirmPassword && password !== confirmPassword ? '#e94560' : '#3d332e' }}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              {confirmPassword && password !== confirmPassword && (
                <p style={{ color: '#e94560', fontSize: '12px', marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
                  Passwords do not match
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
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
                    opacity: !canProceedStep2() ? 0.5 : 1,
                    cursor: !canProceedStep2() ? 'not-allowed' : 'pointer'
                  }} 
                  onClick={handleNextStep}
                  disabled={!canProceedStep2()}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Recovery PIN */}
          {step === 3 && (
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
                Set a 4-digit recovery PIN
              </label>

              <p style={{ fontSize: '12px', color: '#8f7666', marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                This PIN is your only way to recover your password. Write it down somewhere safe. If you lose it, your account cannot be recovered.
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

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{ ...styles.btnSecondary, flex: 1 }} 
                  onClick={() => setStep(2)}
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
                  onClick={handleSubmit}
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
                  {isLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          <div style={styles.authLink}>
            Have account? <button type="button" style={styles.authLinkBtn} onClick={onLogin}>Log In</button>
          </div>
        </div>
      </div>
    </div>
  );
}
