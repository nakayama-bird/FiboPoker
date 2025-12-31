import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { joinRoom, getCurrentParticipant } from '../services/participantService';
import Layout from './Layout';
import DisplayNameInput from './DisplayNameInput';

// T037: RoomPage component structure with state management
export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { room, loading: roomLoading, error: roomError } = useRoom(code || '');
  const [participant, setParticipant] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

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

  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <h2>Room: {room.code}</h2>
        <p>Welcome, {participant.display_name}!</p>
        <p>Card selection functionality will be implemented next</p>
        
        <div style={{ marginTop: '20px' }}>
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
