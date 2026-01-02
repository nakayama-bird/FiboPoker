import type { ReactNode } from 'react';
import styles from '../styles/Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1>FiboPoker</h1>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
