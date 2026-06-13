'use client';

import React, { useState } from 'react';
import { styles } from '../styles';

const DIARY_COLORS = [
  '#ffffff','#000000','#1a1a2e','#16213e','#0f3460','#533483','#e94560',
  '#ff6b6b','#ff9f43','#feca57','#FFC88A','#E6EBF0','#FFC5B8','#007280',
  '#E87280','#7A7280','#FE5E08','#00cec9','#0984e3','#74b9ff','#6c5ce7',
  '#a8e6cf','#ffd3b6','#ffaaa5','#ff8b94','#b2ebf2','#dfe6e9','#fab1a0',
  '#81ecec','#fdcb6e'
];

const DIARY_FONTS = [
  { name: 'Caveat', family: "'Caveat',cursive" },
  { name: 'Crimson Text', family: "'Crimson Text',Georgia,serif" },
  { name: 'Indie Flower', family: "'Indie Flower',cursive" },
  { name: 'Shadows Into Light', family: "'Shadows Into Light',cursive" },
  { name: 'Kalam', family: "'Kalam',cursive" },
  { name: 'Patrick Hand', family: "'Patrick Hand',cursive" },
];

const MOODS = [
  'Heavy','Hopeful','Anxious','Grateful','Numb','Furious','Melancholic',
  'Restless','Peaceful','Overwhelmed','Curious','Lonely','Empowered',
  'Confused','Content'
];

interface Props {
  onPost: (data: any) => void;
  onUpdate?: (data: any) => void;
  initialData?: any;
  onClose: () => void;
}

export default function ComposeOverlay({ onPost, onUpdate, initialData, onClose }: Props) {
  const [mood, setMood] = useState(initialData?.mood || 'Heavy');
  const [customMood, setCustomMood] = useState(initialData?.customMoodVal || '');
  const [isCustomMood, setIsCustomMood] = useState(initialData?.isCustomMood || false);
  const [font, setFont] = useState(initialData?.font || 'Caveat');
  const [content, setContent] = useState(initialData?.content || '');
  const [tags, setTags] = useState(initialData?.tags || '');
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate || false);
  const [showPreview, setShowPreview] = useState(false);

  const finalMood = isCustomMood && customMood ? customMood : mood;
  const assignedColor = DIARY_COLORS[Math.floor(new Date().getSeconds() / 2) % DIARY_COLORS.length];
  const tc = getTextColorForBg(assignedColor);
  const ff = DIARY_FONTS.find(f => f.name === font)?.family || "'Caveat',cursive";

  function getTextColorForBg(bg: string): string {
    const h = bg.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#f0f0f0';
  }

  function handleSubmit() {
    if (!content.trim() && !initialData?.repostOf) return;
    const data = {
      content,
      mood: finalMood,
      font,
      color: assignedColor,
      tags,
      isPrivate,
      editId: initialData?.editId,
      repostOf: initialData?.repostOf,
    };
    if (initialData?.editId && onUpdate) {
      onUpdate({ ...data, id: initialData.editId });
    } else {
      onPost(data);
    }
  }

  if (showPreview) {
    return (
      <div style={styles.overlayScreen}>
        <div style={styles.overlayHeader}>
          <button style={styles.overlayBtn} onClick={() => setShowPreview(false)}>edit</button>
          <h2 style={styles.overlayTitle}>preview</h2>
          <button style={{ ...styles.overlayBtn, ...styles.overlayBtnAccent }} onClick={handleSubmit}>confirm</button>
        </div>
        <div style={{ ...styles.overlayBody, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ ...styles.noteDisplayFull, background: assignedColor, color: tc, fontFamily: ff, maxWidth: '380px', width: '100%' }}>
            <div style={styles.pin} />
            <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p>
            <div style={styles.tags}>
              {tags.split(',').map(t => t.trim()).filter(Boolean).map(t => <span key={t} style={{ ...styles.tag, color: tc }}>#{t}</span>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlayScreen}>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>cancel</button>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c87800', fontSize: '12px', fontWeight: 500, letterSpacing: '2px' }}>
          {initialData?.editId ? 'edit diary' : initialData?.repostOf ? 'add to chain' : 'new diary'}
        </span>
        <button style={{ ...styles.overlayBtn, ...styles.overlayBtnAccent }} onClick={() => setShowPreview(true)} disabled={!content.trim() && !initialData?.repostOf}>
          preview
        </button>
      </div>
      <div style={styles.overlayBody}>
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 500, color: '#8f7666', letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>How are you feeling?</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {MOODS.map((m) => (
              <button key={m} style={{ ...styles.moodBtn, ...(mood === m && !isCustomMood ? styles.moodBtnSelected : {}) }} onClick={() => { setMood(m); setIsCustomMood(false); }}>{m}</button>
            ))}
            <input type="text" style={{ ...styles.input, width: '150px', marginBottom: 0 }} placeholder="or write your own..." value={customMood} onChange={(e) => { setCustomMood(e.target.value); setIsCustomMood(true); }} />
          </div>
        </div>
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 500, color: '#8f7666', letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Choose font</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {DIARY_FONTS.map((f) => (
              <button key={f.name} style={{ ...styles.fontBtn, ...(font === f.name ? styles.fontBtnSelected : {}), fontFamily: f.family }} onClick={() => setFont(f.name)}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1.4, color: '#ebcfbc' }}>The quick brown fox...</span>
                <div style={{ fontSize: '10px', color: '#8f7666', marginTop: '4px' }}>{f.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 500, color: '#8f7666', letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>What is on your mind?</label>
          <textarea style={{ ...styles.composeTextarea, fontFamily: ff }} placeholder="Dump your thoughts here..." value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 500, color: '#8f7666', letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Tags (comma separated)</label>
          <input type="text" style={styles.input} placeholder="midnight, overthinking, small wins..." value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#2a211e', border: '1px solid #3d332e', padding: '14px', borderRadius: '2px' }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 500, color: '#c49b7d' }}>{isPrivate ? 'Private Entry' : 'Public on Wall'}</div>
            <div style={{ fontSize: '10px', color: '#8f7666', fontFamily: "'JetBrains Mono', monospace" }}>{isPrivate ? 'Only you can see this' : 'Anyone can read and respond'}</div>
          </div>
          <button style={{ width: '44px', height: '22px', borderRadius: '11px', background: isPrivate ? '#c87800' : '#3d332e', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', border: 'none' }} onClick={() => setIsPrivate(!isPrivate)}>
            <div style={{ position: 'absolute', top: '2px', left: isPrivate ? '24px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: '#ebcfbc', transition: 'left 0.3s' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
