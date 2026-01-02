import StatisticsDisplay from './StatisticsDisplay';
import ParticipantCards from './ParticipantCards';
import styles from './ResultsView.module.css';

interface Round {
  id: string;
  status: string;
  max_value: number | null;
  min_value: number | null;
  median_value: number | null;
  avg_value: number | null;
}

interface CardSelection {
  participant_id: string;
  card_value: number;
}

interface Participant {
  id: string;
  display_name: string;
  is_active: boolean;
}

interface ResultsViewProps {
  round: Round;
  participants: Participant[];
  selections: CardSelection[];
}

// T053: ResultsView component (implements FR-009)
export default function ResultsView({
  round,
  participants,
  selections,
}: ResultsViewProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>結果発表 🎉</h2>
      </div>

      <StatisticsDisplay
        maxValue={round.max_value}
        minValue={round.min_value}
        medianValue={round.median_value}
        avgValue={round.avg_value}
      />

      <ParticipantCards participants={participants} selections={selections} />
    </div>
  );
}
