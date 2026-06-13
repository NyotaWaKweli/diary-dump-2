import React from 'react';
import DiaryDump from '../components/DiaryDump';
import styles from '../styles'; // fixed import

export default function Page() {
  const sampleEntries = ['First log entry', 'Second log entry'];

  return (
    <main className={styles.main}>
      <DiaryDump entries={sampleEntries} />
    </main>
  );
}
