import { useState } from 'react';
import styles from '../styles/CardSelector.module.css';

interface CardSelectorProps {
  selectedCard: number | null;
  onSelect: (cardValue: number) => void;
  disabled?: boolean;
  loading?: boolean; // T093: Loading state
}

// T036: CardSelector component (implements FR-003, FR-004, FR-005)
// Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21
const FIBONACCI_CARDS = [1, 2, 3, 5, 8, 13, 21];

export default function CardSelector({ selectedCard, onSelect, disabled = false, loading = false }: CardSelectorProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const handleCardClick = (value: number) => {
    if (!disabled && !loading) {
      onSelect(value);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        カードを選択
        {loading && <span className={styles.loadingIndicator}> 送信中...</span>}
      </h3>
      <div className={styles.cardGrid}>
        {FIBONACCI_CARDS.map((value) => {
          const isSelected = selectedCard === value;
          const isHovered = hoveredCard === value;

          return (
            <button
              key={value}
              className={`${styles.card} ${isSelected ? styles.selected : ''} ${isHovered ? styles.hovered : ''}`}
              onClick={() => handleCardClick(value)}
              onMouseEnter={() => setHoveredCard(value)}
              onMouseLeave={() => setHoveredCard(null)}
              disabled={disabled}
              aria-label={`カード ${value}`}
              aria-pressed={isSelected}
            >
              <span className={styles.cardValue}>{value}</span>
            </button>
          );
        })}
      </div>
      {selectedCard !== null && (
        <p className={styles.selectedInfo}>
          選択中: <strong>{selectedCard}</strong>
        </p>
      )}
    </div>
  );
}
