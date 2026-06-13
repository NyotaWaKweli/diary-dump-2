'use client';

import React, { useState, useEffect } from 'react';
import { styles } from '../styles';
import { settingsApi, blockedApi } from '@/lib/api-client';

interface Props {
  onClose: () => void;
}

export default function SettingsOverlay({ onClose }: Props) {
  const [settings, setSettings] = useState({ replies: true, comment_replies: true, bookmarks: true, views: false });
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [blockInput, setBlockInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadBlocked();
  }, []);

  async function loadSettings() {
    try { const res = await settingsApi.get(); if (res.success) setSettings(res.data); } catch {}
    setLoading(false);
  }

  async function loadBlocked() {
    try { const res = await blockedApi.getAll(); if (res.success) setBlockedUsers(res.data); } catch {}
  }

  async function handleSave() {
    try { await settingsApi.update(settings); onClose(); } catch {}
  }

  async function handleBlock() {
    if (!blockInput.trim()) return;
    try { await blockedApi.block(blockInput.trim()); setBlockInput(''); loadBlocked(); } catch {}
  }

  async function handleUnblock(id: string) {
    try { await blockedApi.unblock(id); loadBlocked(); } catch {}
  }

  if (loading) return <div style={styles.overlayScreen}><div style={{ ...styles.overlayBody, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={styles.loadingSpinner} /></div></div>;

  return (
    <div style={styles.overlayScreen}>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>close</button>
        <h2 style={styles.overlayTitle}>settings</h2>
        <div />
      </div>
      <div style={styles.overlayBody}>
        <div style={styles.filterSection}>
          <h3 style={styles.filterSectionTitle}>Notifications</h3>
          {[
            { key: 'replies', label: 'Replies to your diaries' },
            { key: 'comment_replies', label: 'Replies to your comments' },
            { key: 'bookmarks', label: 'When someone saves your diary' },
            { key: 'views', label: 'View milestones' },
          ].map((item) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ fontSize: '14px', color: '#ebcfbc' }}>{item.label}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={settings[item.key as keyof typeof settings]} onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#c87800', cursor: 'pointer' }} />
              </label>
            </div>
          ))}
        </div>

        <div style={styles.filterSection}>
          <h3 style={styles.filterSectionTitle}>Blocked Users</h3>
          {blockedUsers.length === 0 ? <p style={{ color: '#8f7666', fontSize: '13px' }}>No blocked users</p> : blockedUsers.map((u) => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span style={{ color: '#c49b7d' }}>{u.blocked?.username || 'Unknown'}</span>
              <button style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleUnblock(u.blocked_user_id)}>Unblock</button>
            </div>
          ))}
          <input type="text" style={{ ...styles.input, marginTop: '8px' }} placeholder="Username to block..." value={blockInput} onChange={(e) => setBlockInput(e.target.value)} />
          <button style={{ ...styles.btnSecondary, marginTop: '8px' }} onClick={handleBlock}>Block User</button>
        </div>

        <button style={styles.btnPrimary} onClick={handleSave}>Save Settings</button>
      </div>
    </div>
  );
}
