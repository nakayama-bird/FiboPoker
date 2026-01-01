import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { joinRoom, getCurrentParticipant } from '../services/participantService';
import { startRound, getCurrentRound } from '../services/roundService';
import { selectCard, getCardSelection } from '../services/cardSelectionService';
import Layout from './Layout';
import DisplayNameInput from './DisplayNameInput';
import CardSelector from './CardSelector';

// T037-T040: RoomPage with card selection integration
export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { room, loading: roomLoading, error: roomError } = useRoom(code || '');
  const [participant, setParticipant] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  
  // Round and card selection state
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);

  // Check if user is already a participant
  useEffect(() => {
    async function checkParticipant() {
      if (room) {
        const current = await getCurrentParticipant(room.id);
        setParticipant(current);
      }
    }
    checkParticipant();
  }, [room]);

  // Get or create current round
  useEffect(() => {
    async function fetchRound() {
      if (room && participant) {
        const round = await getCurrentRound(room.id);
        if (round) {
          setCurrentRound(round);
          
          // Get existing card selection
          const selection = await getCardSelection(round.id, participant.id);
          if (selection) {
            setSelectedCard(selection.card_value);
          }
        } else {
          // Auto-start first round
          const newRound = await startRound(room.id);
          setCurrentRound(newRound);
        }
      }
    }
    fetchRound();
  }, [room, participant]);

  // T032: Integrate display name input in RoomPage on first visit
  const handleJoinRoom = async (displayName: string) => {
    if (!room) return;
    
    try {
      setJoining(true);
      setJoinError(null);
      
      const newParticipant = await joinRoom({
        roomId: room.id,
        displayName,
      });
      
      setParticipant(newParticipant);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  // T040: Handle card selection (implements FR-004, FR-005)
  const handleCardSelect = async (cardValue: number) => {
    if (!currentRound || !participant) return;
    
    try {
      setSelecting(true);
      await selectCard(currentRound.id, participant.id, cardValue);
      setSelectedCard(cardValue); // SC-003: Immediate visual feedback
    } catch (err) {
      console.error('Failed to select card:', err);
    } finally {
      setSelecting(false);
    }
  };

  if (roomLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p>Loading room...</p>
        </div>
      </Layout>
    );
  }

  if (roomError || !room) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h2>Room Not Found</h2>
          <p>{roomError || 'The room you are looking for does not exist.'}</p>
        </div>
      </Layout>
    );
  }

  // Show display name input if not a participant
  if (!participant) {
    return (
      <Layout>
        <DisplayNameInput onSubmit={handleJoinRoom} loading={joining} />
        {joinError && (
          <p style={{ color: 'red', textAlign: 'center' }}>{joinError}</p>
        )}
      </Layout>
    );
  }

  // T038: Integrate CardSelector component
  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <h2>Room: {room.code}</h2>
        <p>Welcome, {participant.display_name}!</p>
        
        {currentRound && (
          <div style={{ marginTop: '30px' }}>
            <h3>Round {currentRound.round_number}</h3>
            <CardSelector 
              selectedCard={selectedCard}
              onSelect={handleCardSelect}
              disabled={selecting || currentRound.status !== 'selecting'}
            />
          </div>
        )}
        
        <div style={{ marginTop: '30px' }}>
          <h3>Participants ({room.participants.length})</h3>
          <ul>
            {room.participants.map((p) => (
              <li key={p.id}>
                {p.display_name} {p.is_active ? '🟢' : '🔴'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
