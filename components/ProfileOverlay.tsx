'use client';

import React, { useState, useRef } from 'react';
import { styles } from '../styles';

interface Props {
  user: any;
  onUpdate: (data: any) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
  onUpdatePassword: (pw: string) => Promise<void>;
  onDeleteAccount: () => void;
  onClose: () => void;
}

export default function ProfileOverlay({ user, onUpdate, onUploadAvatar, onUpdatePassword, onDeleteAccount, onClose }: Props) {
  const [username, setUsername] = useState(user.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState(user.recovery_pin || '');
  const [showPin, setShowPin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateUsername(u: string): boolean {
    if (!u) { setError('Username is required'); return false; }
    if (!/^[a-z0-9._]+$/.test(u)) { setError('Username: lowercase letters, numbers, dots, underscores only'); return false; }
    if (u.length < 3) { setError('Username must be at least 3 characters'); return false; }
    if (u.length > 30) { setError('Username must be at most 30 characters'); return false; }
    return true;
  }

  async function handleSave() {
    setError(''); setSuccess('');
    if (!validateUsername(username)) return;
    if (recoveryPin && !/^\d{4}$/.test(recoveryPin)) { setError('PIN must be exactly 4 digits'); return; }

    setIsLoading(true);
    try {
      await onUpdate({ username, recoveryPin: recoveryPin || undefined, avatarUrl });
      if (newPassword) {
        if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
        await onUpdatePassword(newPassword);
      }
      setSuccess('Profile updated successfully');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) { setError('Invalid file type'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('File too large (max 2MB)'); return; }
    try {
      const url = await onUploadAvatar(file);
      setAvatarUrl(url);
      setSuccess('Avatar updated');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    }
  }

  function handleDeleteClick() {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    if (deleteConfirmText !== 'DELETE') {
      setError('Type DELETE to confirm');
      return;
    }
    onDeleteAccount();
  }

  return (
    <div style={styles.overlayScreen}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>close</button>
        <h2 style={styles.overlayTitle}>profile</h2>
        <div />
      </div>
      <div style={styles.overlayBody}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #3d332e' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#2a1f1a', border: '2px solid #3d332e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: '#c87800', overflow: 'hidden' }}>
            {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : user.username.substring(0, 2).toUpperCase()}
          </div>
          <button style={{ background: '#2a211e', border: '1px solid #3d332e', color: '#8f7666', padding: '6px 14px', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }} onClick={() => fileInputRef.current?.click()}>
            Change Profile Picture
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {error && (
          <div style={{ background: 'rgba(233, 69, 96, 0.1)', border: '1px solid rgba(233, 69, 96, 0.3)', borderRadius: '2px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#e94560', fontSize: '14px' }}>⚠</span>
            <span style={{ color: '#e94560', fontSize: '13px' }}>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '2px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#4caf50', fontSize: '14px' }}>✓</span>
            <span style={{ color: '#4caf50', fontSize: '13px' }}>{success}</span>
          </div>
        )}

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 500, color: '#8f7666', letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Username</label>
          <input type="text" style={styles.input} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 500, color: '#8f7666', letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>New Password (optional)</label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} style={{ ...styles.input, marginBottom: 0, paddingRight: '40px' }} placeholder="Leave blank to keep current" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8f7666', cursor: 'pointer', fontSize: '13px', padding: '4px' }}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 500, color: '#8f7666', letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Recovery PIN</label>
          <div style={{ position: 'relative' }}>
            <input type={showPin ? 'text' : 'password'} style={{ ...styles.input, marginBottom: 0, paddingRight: '40px' }} value={recoveryPin} onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} />
            <button type="button" onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8f7666', cursor: 'pointer', fontSize: '13px', padding: '4px' }}>
              {showPin ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button 
          style={{ ...styles.btnPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }} 
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading && <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #3d332e' }}>
          {!showDeleteConfirm ? (
            <button style={styles.btnDanger} onClick={handleDeleteClick}>
              Delete Account Permanently
            </button>
          ) : (
            <div style={{ background: 'rgba(233, 69, 96, 0.05)', border: '1px solid rgba(233, 69, 96, 0.2)', borderRadius: '2px', padding: '16px' }}>
              <p style={{ color: '#e94560', fontSize: '13px', marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
                ⚠ This action cannot be undone. All your diaries, comments, and data will be permanently deleted.
              </p>
              <p style={{ color: '#8f7666', fontSize: '12px', marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
                Type DELETE to confirm:
              </p>
              <input 
                type="text" 
                style={{ ...styles.input, borderColor: '#e94560', marginBottom: '12px' }} 
                placeholder="DELETE" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleDeleteClick(); }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>
                  Cancel
                </button>
                <button style={{ flex: 1, background: '#e94560', color: '#fff', border: 'none', padding: '12px', borderRadius: '2px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, opacity: deleteConfirmText === 'DELETE' ? 1 : 0.5 }} onClick={handleDeleteClick} disabled={deleteConfirmText !== 'DELETE'}>
                  Permanently Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
