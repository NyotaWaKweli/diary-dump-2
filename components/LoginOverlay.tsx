'use client';

import React, { useState, useRef, useEffect } from 'react';
import { styles } from '../styles';

interface Props {
  onLogin: (username: string, password: string) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
  onClose: () => void;
}

export default function LoginOverlay({ onLogin, onRegister, onForgotPassword, onClose }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  function triggerShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }

  function validateUsername(u: string): boolean {
    if (!u) { setError('Username is required'); return false; }
    if (!/^[a-z0-9._]+$/.test(u)) { setError('Username: lowercase letters, numbers, dots, underscores only'); return false; }
    if (u.length < 3) { setError('Username must be at least 3 characters'); return false; }
    if (u.length > 30) { setError('Username must be at most 30 characters'); return false; }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateUsername(username)) { triggerShake(); return; }
    if (!password) { setError('Password is required'); triggerShake(); return; }

    setIsLoading(true);
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
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
      `}</style>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>close</button>
        <h2 style={styles.overlayTitle}>log in</h2>
        <div />
      </div>
      <div style={{ ...styles.overlayBody, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleSubmit} style={{ ...styles.authCard, ...shakeStyle }}>
          <h2 style={styles.authTitle}>diary dump</h2>
          <p style={styles.authSubtitle}>welcome back</p>

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

          <input
            ref={usernameRef}
            type="text"
            style={{ ...styles.input, borderColor: error && !username ? '#e94560' : '#3d332e' }}
            placeholder="Username"
            value={username}
            onChange={(e) => { setUsername(e.target.value.toLowerCase()); setError(''); }}
            autoComplete="username"
            disabled={isLoading}
          />

          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              style={{ ...styles.input, marginBottom: 0, paddingRight: '40px', borderColor: error && !password ? '#e94560' : '#3d332e' }}
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
              disabled={isLoading}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: '#c87800',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            style={{ 
              ...styles.btnPrimary, 
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }} 
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
            {isLoading ? 'Signing in...' : 'Log In'}
          </button>

          <div style={styles.authLink}>
            No account? <button type="button" style={styles.authLinkBtn} onClick={onRegister}>Register</button>
          </div>
        </form>
      </div>
    </div>
  );
}
