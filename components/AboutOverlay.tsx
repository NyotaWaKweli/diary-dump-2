import React from 'react';
import styles from '../styles'; // fixed import

export default function AboutOverlay() {
  return (
    <div className={styles.overlay}>
      <h2>About Diary Dump</h2>
      <p>This is a simple journaling app built with Next.js and Supabase.</p>
    </div>
  );
}
