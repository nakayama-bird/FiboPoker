import { useState } from 'react';
import styles from './ForceRevealButton.module.css';

interface ForceRevealButtonProps {
  onForceReveal: () => Promise<void>;
}

// Force reveal button for owner to close voting early
export default function ForceRevealButton({ onForceReveal }: ForceRevealButtonProps) {
  const [revealing, setRevealing] = useState(false);

  const handleClick = async () => {
    if (revealing) return;
    
    if (!window.confirm('投票を締め切り、現在の選択のみで結果を表示しますか？')) {
      return;
    }
    
    try {
      setRevealing(true);
      await onForceReveal();
    } catch (error) {
      console.error('Failed to force reveal:', error);
      alert('締め切りに失敗しました。もう一度お試しください。');
    } finally {
      setRevealing(false);
    }
  };

  return (
    <button
      className={styles.button}
      onClick={handleClick}
      disabled={revealing}
    >
      {revealing ? '締め切り中...' : '⏰ 投票を締め切る'}
    </button>
  );
}
