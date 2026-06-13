'use client';

import React from 'react';
import { styles } from '../styles';

interface Props {
  notifications: any[];
  onClose: () => void;
  onClearAll: () => void;
}

export default function NotificationsOverlay({ notifications, onClose, onClearAll }: Props) {
  function formatTime(ts: string): string {
    const now = new Date();
    const t = new Date(ts);
    const diff = Math.floor((now.getTime() - t.getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }

  return (
    <div style={styles.overlayScreen}>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>close</button>
        <h2 style={styles.overlayTitle}>notifications</h2>
        {notifications.length > 0 ? <button style={{ ...styles.overlayBtn, color: '#f5a623' }} onClick={onClearAll}>clear all</button> : <div />}
      </div>
      <div style={styles.overlayBody}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8f7666', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', background: n.is_read ? '#2a211e' : '#241f1b', border: '1px solid #3d332e', borderRadius: '2px', marginBottom: '8px', borderLeft: n.is_read ? '1px solid #3d332e' : '3px solid #f5a623' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#241f1b', border: '1px solid #3d332e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#c87800', flexShrink: 0 }}>
                {n.from_user?.substring(0, 2).toUpperCase() || 'DD'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 400, color: '#c49b7d', lineHeight: 1.4, marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: n.message }} />
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#8f7666', letterSpacing: '0.5px' }}>{formatTime(n.created_at)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
