import { useState } from 'react';
import styles from './NewRoundButton.module.css';

interface NewRoundButtonProps {
  onStartNewRound: () => Promise<void>;
}

// T058: NewRoundButton component
export default function NewRoundButton({ onStartNewRound }: NewRoundButtonProps) {
  const [starting, setStarting] = useState(false);

  const handleClick = async () => {
    if (starting) return;
    
    try {
      setStarting(true);
      await onStartNewRound();
    } catch (error) {
      console.error('Failed to start new round:', error);
    } finally {
      setStarting(false);
    }
  };

  return (
    <button
      className={styles.button}
      onClick={handleClick}
      disabled={starting}
    >
      {starting ? '準備中...' : '新しいラウンドを開始'}
    </button>
  );
}
