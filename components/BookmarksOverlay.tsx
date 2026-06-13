import React from 'react';
import styles from '../styles'; // fixed import

function formatContent(t: string) {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function BookmarksOverlay({ content }: { content: string }) {
  return (
    <div className={styles.overlay}>
      <h2>Bookmarks</h2>
      <p dangerouslySetInnerHTML={{ __html: formatContent(content) }} />
    </div>
  );
}
