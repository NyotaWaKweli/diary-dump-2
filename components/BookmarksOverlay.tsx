'use client';

import React, { useState, useEffect } from 'react';
import { styles } from '../styles';
import { bookmarkApi } from '@/lib/api-client';

interface Props {
  onClose: () => void;
}

export default function BookmarksOverlay({ onClose }: Props) {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBookmarks(); }, []);

  async function loadBookmarks() {
    try { const res = await bookmarkApi.getAll(); if (res.success) setBookmarks(res.data); } catch {}
    setLoading(false);
  }

  async function handleUnsave(diaryId: string) {
    try { await bookmarkApi.toggle(diaryId); loadBookmarks(); } catch {}
  }

  function getTextColorForBg(bg: string): string {
    const h = bg.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#f0f0f0';
  }

  function formatContent(t: string): string {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/
/g, '<br>');
  }

  if (loading) return <div style={styles.overlayScreen}><div style={{ ...styles.overlayBody, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={styles.loadingSpinner} /></div></div>;

  return (
    <div style={styles.overlayScreen}>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>close</button>
        <h2 style={styles.overlayTitle}>bookmarks</h2>
        <div />
      </div>
      <div style={styles.overlayBody}>
        {bookmarks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8f7666', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>No bookmarked diaries</div>
        ) : (
          bookmarks.map((bm) => {
            const diary = bm.diaries;
            if (!diary) return null;
            const tc = getTextColorForBg(diary.color);
            const ff = diary.font || "'Caveat',cursive";
            return (
              <div key={bm.id} style={{ ...styles.noteDisplayFull, background: diary.color, color: tc, fontFamily: ff, marginBottom: '16px' }}>
                <div style={styles.pin} />
                <p style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: formatContent(diary.content.substring(0, 200) + (diary.content.length > 200 ? '...' : '')) }} />
                <div style={styles.tags}>{diary.tags?.map((t: string) => <span key={t} style={{ ...styles.tag, color: tc }}>#{t}</span>)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>{diary.profiles?.username || 'unknown'}</span>
                  <button style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: '11px' }} onClick={() => handleUnsave(diary.id)}>unsave</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
