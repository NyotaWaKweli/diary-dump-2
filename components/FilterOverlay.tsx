'use client';

import React, { useState } from 'react';
import { styles } from '../styles';

const MOODS = [
  'Heavy','Hopeful','Anxious','Grateful','Numb','Furious','Melancholic',
  'Restless','Peaceful','Overwhelmed','Curious','Lonely','Empowered',
  'Confused','Content'
];

const DIARY_FONTS = [
  { name: 'Caveat' }, { name: 'Crimson Text' }, { name: 'Indie Flower' },
  { name: 'Shadows Into Light' }, { name: 'Kalam' }, { name: 'Patrick Hand' },
];

interface Props {
  activeFilters: any;
  onApply: (filters: any) => void;
  onClose: () => void;
}

export default function FilterOverlay({ activeFilters, onApply, onClose }: Props) {
  const [filters, setFilters] = useState(activeFilters);

  function setFilterChip(key: string, value: string) {
    setFilters({ ...filters, [key]: value });
  }

  function toggleArrayFilter(key: string, value: string) {
    const arr = [...(filters[key] as string[])];
    const idx = arr.indexOf(value);
    if (idx > -1) arr.splice(idx, 1);
    else arr.push(value);
    setFilters({ ...filters, [key]: arr });
  }

  function handleApply() {
    onApply(filters);
    onClose();
  }

  function handleReset() {
    const reset = { timeRange: 'all', mood: [], customMood: '', font: [], popularity: 'all', tag: [], customTag: '', colorGroup: 'all', author: '', sortBy: 'newest', contentLength: 'all' };
    setFilters(reset);
    onApply(reset);
  }

  return (
    <div style={styles.overlayScreen}>
      <div style={styles.overlayHeader}>
        <button style={styles.overlayBtn} onClick={onClose}>cancel</button>
        <h2 style={styles.overlayTitle}>filter diaries</h2>
        <button style={{ ...styles.overlayBtn, color: '#f5a623' }} onClick={handleReset}>reset</button>
      </div>
      <div style={styles.overlayBody}>
        <div style={styles.filterSection}>
          <h3 style={styles.filterSectionTitle}>Time Range</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { v: 'all', l: 'All Time' }, { v: 'hour', l: 'Last Hour' },
              { v: 'day', l: 'Last 24h' }, { v: 'week', l: 'Last 7 Days' },
              { v: 'month', l: 'Last 30 Days' },
            ].map((o) => (
              <button key={o.v} style={{ ...styles.filterChip, ...(filters.timeRange === o.v ? styles.filterChipActive : {}) }} onClick={() => setFilterChip('timeRange', o.v)}>{o.l}</button>
            ))}
          </div>
        </div>

        <div style={styles.filterSection}>
          <h3 style={styles.filterSectionTitle}>Mood</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {MOODS.map((m) => (
              <button key={m} style={{ ...styles.filterChip, ...(filters.mood.includes(m) ? styles.filterChipActive : {}) }} onClick={() => toggleArrayFilter('mood', m)}>{m}</button>
            ))}
          </div>
          <input type="text" style={{ ...styles.input, marginTop: '8px' }} placeholder="Search custom mood..." value={filters.customMood} onChange={(e) => setFilters({ ...filters, customMood: e.target.value })} />
        </div>

        <div style={styles.filterSection}>
          <h3 style={styles.filterSectionTitle}>Font Style</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {DIARY_FONTS.map((f) => (
              <button key={f.name} style={{ ...styles.filterChip, ...(filters.font.includes(f.name) ? styles.filterChipActive : {}) }} onClick={() => toggleArrayFilter('font', f.name)}>{f.name}</button>
            ))}
          </div>
        </div>

        <div style={styles.filterSection}>
          <h3 style={styles.filterSectionTitle}>Popularity</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { v: 'all', l: 'All' }, { v: 'trending', l: 'Trending (500+)' },
              { v: 'most_viewed', l: 'Most Viewed' }, { v: 'most_commented', l: 'Most Commented' },
              { v: 'least_viewed', l: 'Least Viewed' },
            ].map((o) => (
              <button key={o.v} style={{ ...styles.filterChip, ...(filters.popularity === o.v ? styles.filterChipActive : {}) }} onClick={() => setFilterChip('popularity', o.v)}>{o.l}</button>
            ))}
          </div>
        </div>

        <div style={styles.filterSection}>
          <h3 style={styles.filterSectionTitle}>Color</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { v: 'all', l: 'All Colors' }, { v: 'light', l: 'Light Diaries' }, { v: 'dark', l: 'Dark Diaries' },
            ].map((o) => (
              <button key={o.v} style={{ ...styles.filterChip, ...(filters.colorGroup === o.v ? styles.filterChipActive : {}) }} onClick={() => setFilterChip('colorGroup', o.v)}>{o.l}</button>
            ))}
          </div>
        </div>

        <div style={styles.filterSection}>
          <h3 style={styles.filterSectionTitle}>Author</h3>
          <input type="text" style={styles.input} placeholder="Search by username..." value={filters.author} onChange={(e) => setFilters({ ...filters, author: e.target.value })} />
        </div>

        <div style={styles.filterSection}>
          <h3 style={styles.filterSectionTitle}>Content Length</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { v: 'all', l: 'Any Length' }, { v: 'short', l: 'Short (<100)' },
              { v: 'medium', l: 'Medium (100-300)' }, { v: 'long', l: 'Long (300+)' },
            ].map((o) => (
              <button key={o.v} style={{ ...styles.filterChip, ...(filters.contentLength === o.v ? styles.filterChipActive : {}) }} onClick={() => setFilterChip('contentLength', o.v)}>{o.l}</button>
            ))}
          </div>
        </div>

        <div style={styles.filterSection}>
          <h3 style={styles.filterSectionTitle}>Sort By</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { v: 'newest', l: 'Newest First' }, { v: 'oldest', l: 'Oldest First' },
              { v: 'most_viewed', l: 'Most Viewed' }, { v: 'most_commented', l: 'Most Commented' },
              { v: 'random', l: 'Random' },
            ].map((o) => (
              <button key={o.v} style={{ ...styles.filterChip, ...(filters.sortBy === o.v ? styles.filterChipActive : {}) }} onClick={() => setFilterChip('sortBy', o.v)}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 20px', borderTop: '1px solid #3d332e', background: '#241f1b', display: 'flex', gap: '10px' }}>
        <button style={{ flex: 1, padding: '12px', borderRadius: '2px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', background: 'none', color: '#8f7666', border: '1px solid #3d332e' }} onClick={handleReset}>Clear All</button>
        <button style={{ flex: 1, padding: '12px', borderRadius: '2px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', background: '#c87800', color: '#fff', border: '1px solid #c87800' }} onClick={handleApply}>Apply Filters</button>
      </div>
    </div>
  );
}
