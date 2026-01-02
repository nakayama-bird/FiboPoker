import styles from './StatisticsDisplay.module.css';

interface StatisticsDisplayProps {
  maxValue: number | null;
  minValue: number | null;
  medianValue: number | null;
  avgValue: number | null;
}

// T054: StatisticsDisplay component (implements FR-008)
export default function StatisticsDisplay({
  maxValue,
  minValue,
  medianValue,
  avgValue,
}: StatisticsDisplayProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>統計情報</h3>
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
