import { useState, type FormEvent } from 'react';
import styles from '../styles/DisplayNameInput.module.css';

interface DisplayNameInputProps {
  onSubmit: (displayName: string) => void;
  loading?: boolean;
}

// T031: Display name input component (implements FR-011)
export default function DisplayNameInput({ onSubmit, loading = false }: DisplayNameInputProps) {
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      onSubmit(displayName.trim());
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>ルームに参加</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="displayName" className={styles.label}>
            表示名
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="名前を入力してください"
            maxLength={50}
            required
            disabled={loading}
            className={styles.input}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !displayName.trim()}
          className={styles.submitButton}
        >
          {loading ? '参加中...' : '参加する'}
        </button>
      </form>
    </div>
  );
}
