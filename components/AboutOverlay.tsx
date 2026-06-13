'use client';

import React from 'react';
import { styles } from '../styles';

interface Props {
  onClose: () => void;
}

export default function AboutOverlay({ onClose }: Props) {
  return (
    <div style={styles.overlayScreen}>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>close</button>
        <h2 style={styles.overlayTitle}>about</h2>
        <div />
      </div>
      <div style={{ ...styles.overlayBody, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '32px 24px' }}>
        <h3 style={{ fontFamily: "'Libre Bodoni', Georgia, serif", fontSize: '28px', fontStyle: 'italic', color: '#ebcfbc' }}>diary dump</h3>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#8f7666', lineHeight: 1.8, maxWidth: '400px' }}>
          A scattered wall of personal diaries. No profiles. No followers. Just thoughts pinned to a wall.
        </p>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#c87800', letterSpacing: '2px' }}>version 1.0</div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#8f7666', lineHeight: 1.8, maxWidth: '400px' }}>
          Built with care for those who need a safe space.
        </p>
      </div>
    </div>
  );
}
