import React from 'react';
import styles from '../styles'; // fixed import

export default function DiaryDump({ entries }: { entries: string[] }) {
  return (
    <div className={styles.container}>
      <h1>Diary Dump</h1>
      <ul>
        {entries.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
