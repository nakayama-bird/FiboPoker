import styles from './WaitingRoom.module.css';
import NewRoundButton from './NewRoundButton';

interface WaitingRoomProps {
  participants: Array<{ display_name: string; is_owner: boolean }>;
  isOwner: boolean;
  onStartGame: () => Promise<void>;
}

export default function WaitingRoom({ participants, isOwner, onStartGame }: WaitingRoomProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>参加者を待っています...</h2>
      
      <div className={styles.participantsList}>
        <h3 className={styles.subtitle}>参加者 ({participants.length}名)</h3>
        <ul className={styles.list}>
          {participants.map((p, index) => (
            <li key={index} className={styles.participant}>
              {p.display_name}
              {p.is_owner && <span className={styles.ownerBadge}>👑 オーナー</span>}
            </li>
          ))}
        </ul>
      </div>

      {isOwner ? (
        <div className={styles.ownerSection}>
          <p className={styles.instruction}>
            全員揃ったらゲームを開始してください
          </p>
          <NewRoundButton onStartNewRound={onStartGame} />
        </div>
      ) : (
        <p className={styles.waitingMessage}>
          オーナーがゲームを開始するまでお待ちください...
        </p>
      )}
    </div>
  );
}
