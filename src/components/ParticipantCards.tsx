import styles from './ParticipantCards.module.css';

interface CardSelection {
  participant_id: string;
  card_value: number;
}

interface Participant {
  id: string;
  display_name: string;
  is_active: boolean;
}

interface ParticipantCardsProps {
  participants: Participant[];
  selections: CardSelection[];
}

// T055: ParticipantCards component showing all selections
export default function ParticipantCards({
  participants,
  selections,
}: ParticipantCardsProps) {
  const getCardForParticipant = (participantId: string) => {
    return selections.find((s) => s.participant_id === participantId)?.card_value;
  };

  const activeParticipants = participants.filter((p) => p.is_active);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>選択結果</h3>
      <div className={styles.cards}>
        {activeParticipants.map((participant) => {
          const cardValue = getCardForParticipant(participant.id);
          return (
            <div key={participant.id} className={styles.participantCard}>
              <div className={styles.name}>{participant.display_name}</div>
              <div className={styles.card}>
                {cardValue !== undefined ? cardValue : '?'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
