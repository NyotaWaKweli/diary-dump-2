'use client';

import React, { useState, useEffect } from 'react';
import { styles } from '../styles';
import { diaryApi } from '@/lib/api-client';

interface Props {
  onClose: () => void;
  onEdit: (diary: any) => void;
  onDelete: (id: string) => void;
}

export default function MyDiariesOverlay({ onClose, onEdit, onDelete }: Props) {
  const [diaries, setDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDiaries(); }, []);

  async function loadDiaries() {
    try {
      const res = await diaryApi.getAll({ author: 'me' });
      if (res.success) setDiaries(res.data);
    } catch {}
    setLoading(false);
  }

  function getTextColorForBg(bg: string): string {
    const h = bg.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#f0f0f0';
  }

  function formatDateTime(ts: string): string {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function formatViews(v: number): string { return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toString(); }

  if (loading) return <div style={styles.overlayScreen}><div style={{ ...styles.overlayBody, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={styles.loadingSpinner} /></div></div>;

  return (
    <div style={styles.overlayScreen}>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>close</button>
        <h2 style={styles.overlayTitle}>my diaries</h2>
        <div />
      </div>
      <div style={styles.overlayBody}>
        {diaries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8f7666', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>You haven't shared any diaries yet</div>
        ) : (
          diaries.map((d) => {
            const tc = getTextColorForBg(d.color);
            const ff = d.font || "'Caveat',cursive";
            return (
              <div key={d.id} style={{ ...styles.noteDisplayFull, background: d.color, color: tc, fontFamily: ff, marginBottom: '16px' }}>
                <div style={styles.pin} />
                <p style={{ whiteSpace: 'pre-wrap' }}>{d.content}</p>
                <div style={styles.tags}>{d.tags?.map((t: string) => <span key={t} style={{ ...styles.tag, color: tc }}>#{t}</span>)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: tc, opacity: 0.7 }}>
                  <span>Views: {formatViews(d.views)}</span><span>Comments: {d.comments?.length || 0}</span>
                  <span>Saves: {d.saves || 0}</span><span>{formatDateTime(d.created_at)}</span>
                  <span>Status: {d.is_private ? 'Private' : 'Public'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <button style={{ background: '#2a211e', border: '1px solid #3d332e', color: '#f5a623', padding: '6px 12px', borderRadius: '2px', cursor: 'pointer', fontSize: '11px' }} onClick={() => onEdit(d)}>edit</button>
                  <button style={{ background: '#2a211e', border: '1px solid #e94560', color: '#e94560', padding: '6px 12px', borderRadius: '2px', cursor: 'pointer', fontSize: '11px' }} onClick={() => onDelete(d.id)}>delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
