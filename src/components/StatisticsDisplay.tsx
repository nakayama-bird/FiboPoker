import styles from './StatisticsDisplay.module.css';

interface StatisticsDisplayProps {
  maxValue: number | null;
  minValue: number | null;
  medianValue: number | null;
  avgValue: number | null;
  participantCount?: number; // T082: For single participant scenario
}

// T054: StatisticsDisplay component (implements FR-008)
// T082: Handle single participant scenario
// T083: Handle unanimous selection - highlight when all cards are the same
export default function StatisticsDisplay({
  maxValue,
  minValue,
  medianValue,
  avgValue,
  participantCount = 0,
}: StatisticsDisplayProps) {
  // T083: Check if all participants selected the same card
  const isUnanimous = maxValue !== null && minValue !== null && maxValue === minValue && participantCount > 1;
  
  // T082: Single participant scenario
  const isSingleParticipant = participantCount === 1;
  
  return (
    <div className={`${styles.container} ${isUnanimous ? styles.unanimous : ''}`}>
      <h3 className={styles.title}>
        統計情報
        {isUnanimous && <span className={styles.unanimousBadge}>✨ 全員一致</span>}
        {isSingleParticipant && <span className={styles.singleBadge}>👤 1人のみ</span>}
      </h3>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.label}>最大値</span>
          <span className={styles.value}>{maxValue ?? '-'}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.label}>最小値</span>
          <span className={styles.value}>{minValue ?? '-'}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.label}>中央値</span>
          <span className={styles.value}>{medianValue ?? '-'}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.label}>平均値</span>
          <span className={styles.value}>{avgValue?.toFixed(1) ?? '-'}</span>
        </div>
      </div>
    </div>
  );
}
