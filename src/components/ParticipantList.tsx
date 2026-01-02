import styles from '../styles/ParticipantList.module.css';

interface Participant {
  id: string;
  display_name: string;
  is_active: boolean;
  is_owner: boolean;
}

interface ParticipantListProps {
  participants: Participant[];
  currentRoundId?: string;
  selectedParticipantIds?: Set<string>;
}

export function ParticipantList({ 
  participants, 
  currentRoundId,
  selectedParticipantIds = new Set()
}: ParticipantListProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        参加者 ({participants.length})
      </h3>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.headerName}>名前</th>
              <th className={styles.headerStatus}>状態</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => {
              const hasSelected = selectedParticipantIds.has(participant.id);
              const isActive = participant.is_active;
              
              return (
                <tr
                  key={participant.id}
                  className={`${styles.row} ${!isActive ? styles.inactive : ''}`}
                >
                  <td className={styles.nameCell}>
                    {participant.is_owner && <span className={styles.crown}>👑 </span>}
                    <span className={styles.name}>{participant.display_name}</span>
                  </td>
                  <td className={styles.statusCell}>
                    {isActive ? (
                      currentRoundId && hasSelected ? (
                        <span className={styles.badge} title="選択済み">
                          ✓ 選択済み
                        </span>
                      ) : (
                        currentRoundId && (
                          <span className={styles.waiting} title="選択中">
                            ⏳ 選択中
                          </span>
                        )
                      )
                    ) : (
                      <span className={styles.offline} title="オフライン">
                        🔴 オフライン
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
