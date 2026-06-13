'use client';

import React, { useState } from 'react';
import { styles } from '../styles';

interface Diary {
  id: string;
  content: string;
  author: string;
  author_id: string;
  avatar_url: string;
  mood: string;
  color: string;
  font: string;
  views: number;
  saves: number;
  comments: any[];
  created_at: string;
  tags: string[];
  is_private: boolean;
  is_bookmarked?: boolean;
  repost_chain?: any[];
}

interface Props {
  diary: Diary;
  currentUser: any;
  onClose: () => void;
  onBookmark: () => void;
  onDelete: () => void;
  onBlockUser: (username: string) => void;
}

export default function DetailOverlay({ diary, currentUser, onClose, onBookmark, onDelete, onBlockUser }: Props) {
  const [commentText, setCommentText] = useState('');
  const tc = getTextColorForBg(diary.color);
  const ff = diary.font || "'Caveat',cursive";
  const isOwner = currentUser?.id === diary.author_id;

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

  function escapeHtml(t: string): string {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function formatContent(t: string): string { return escapeHtml(t).replace(/\n/g, '<br>'); }

  return (
    <div style={styles.overlayScreen}>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>← back</button>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isOwner ? (
            <>
              <button style={{ ...styles.overlayBtn, color: '#f5a623' }} onClick={() => {}}>edit</button>
              <button style={{ ...styles.overlayBtn, color: '#e94560' }} onClick={onDelete}>delete</button>
            </>
          ) : (
            <button style={{ ...styles.overlayBtn, color: '#e94560', fontSize: '11px' }} onClick={() => onBlockUser(diary.author)}>block user</button>
          )}
        </div>
        {isOwner ? null : (
          <button style={{ ...styles.overlayBtn, color: '#f5a623' }} onClick={onBookmark}>
            {diary.is_bookmarked ? 'saved' : 'save'}
          </button>
        )}
      </div>
      <div style={styles.overlayBody}>
        <div style={{ ...styles.noteDisplayFull, background: diary.color, color: tc, fontFamily: ff }}>
          <div style={styles.pin} />
          <p style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: formatContent(diary.content) }} />
          <div style={styles.tags}>
            {diary.tags.map((t) => <span key={t} style={{ ...styles.tag, color: tc }}>#{t}</span>)}
          </div>
        </div>

        {diary.repost_chain && diary.repost_chain.map((entry, i) => {
          const etc = getTextColorForBg(entry.color || diary.color);
          const eff = entry.font || diary.font || "'Caveat',cursive";
          return (
            <div key={i} style={{ ...styles.noteDisplayFull, background: entry.color || diary.color, color: etc, fontFamily: eff, marginTop: '16px' }}>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: '10px', color: '#c87800', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>
                entry {i + 2} · {entry.author} · {formatDateTime(entry.created_at)}
              </div>
              <p style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: formatContent(entry.content) }} />
            </div>
          );
        })}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #3d332e' }}>
          <div style={styles.infoBlock}><span style={styles.infoLabel}>Views</span><span style={styles.infoValue}>{formatViews(diary.views)}</span></div>
          <div style={styles.infoBlock}><span style={styles.infoLabel}>Comments</span><span style={styles.infoValue}>{diary.comments?.length || 0}</span></div>
          <div style={styles.infoBlock}><span style={styles.infoLabel}>Saves</span><span style={styles.infoValue}>{diary.saves || 0}</span></div>
          <div style={styles.infoBlock}><span style={styles.infoLabel}>Posted</span><span style={{ ...styles.infoValue, fontSize: '11px' }}>{formatDateTime(diary.created_at)}</span></div>
          <div style={styles.infoBlock}><span style={styles.infoLabel}>Mood</span><span style={styles.infoValue}>{diary.mood}</span></div>
          <div style={styles.infoBlock}><span style={styles.infoLabel}>Status</span><span style={styles.infoValue}>{diary.is_private ? 'Private' : 'Public'}</span></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #3d332e' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2a1f1a', color: '#c87800', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #3d332e', overflow: 'hidden' }}>
            {diary.avatar_url ? <img src={diary.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : diary.author.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 500, color: '#ebcfbc' }}>{diary.author}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#8f7666', fontStyle: 'italic' }}>shared a diary</div>
          </div>
        </div>

        <div>
          <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 500, color: '#c87800', letterSpacing: '2px', marginBottom: '14px', textTransform: 'uppercase' }}>
            Responses ({diary.comments?.length || 0})
          </h3>
          {diary.comments?.map((cm: any) => (
            <div key={cm.id} style={styles.comment}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={styles.commentAuthor}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2a1f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                    {cm.avatar_url ? <img src={cm.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : cm.author.substring(0, 2).toUpperCase()}
                  </div>
                  {cm.author}
                </div>
              </div>
              <div style={styles.commentText} dangerouslySetInnerHTML={{ __html: formatContent(cm.content) }} />
              <div style={styles.commentTime}>{formatDateTime(cm.created_at)}</div>
            </div>
          )) || <p style={{ color: '#8f7666', fontSize: '13px' }}>No comments yet</p>}
        </div>

        {currentUser && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #3d332e' }}>
            <textarea
              style={{ flex: 1, background: '#2a211e', border: '1px solid #3d332e', color: '#ebcfbc', padding: '12px', borderRadius: '2px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', resize: 'none', minHeight: '72px', outline: 'none' }}
              placeholder="Share a kind thought..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button style={{ background: '#c87800', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '2px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 500, letterSpacing: '1px', alignSelf: 'flex-end' }}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
