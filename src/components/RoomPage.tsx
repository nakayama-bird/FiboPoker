import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { useRealtime } from '../hooks/useRealtime';
import { connectionMonitor } from '../services/supabase';
import { joinRoom, getCurrentParticipant } from '../services/participantService';
import { startRound, getCurrentRound, calculateStatistics, updateRoundStatus } from '../services/roundService';
import { selectCard, getCardSelection, getCardSelections } from '../services/cardSelectionService';
import { checkAllSelected } from '../services/completionService';
import Layout from './Layout';
import DisplayNameInput from './DisplayNameInput';
import CardSelector from './CardSelector';
import ResultsView from './ResultsView';
import NewRoundButton from './NewRoundButton';
import ForceRevealButton from './ForceRevealButton';
import WaitingRoom from './WaitingRoom';
import { InvitationLink } from './InvitationLink';
import { ParticipantList } from './ParticipantList';
import { ReconnectionIndicator } from './ReconnectionIndicator';

// T037-T040, T048: RoomPage with card selection and realtime integration
export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { room, loading: roomLoading, error: roomError, refetch: refetchRoom } = useRoom(code || '');
  const [participant, setParticipant] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  
  // Round and card selection state
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [cardSelections, setCardSelections] = useState<any[]>([]);
  
  // Track which participants have selected cards
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
  
  // T093: Loading states for async operations
  const [selectingCard, setSelectingCard] = useState(false);
  const [startingRound, setStartingRound] = useState(false);

  // T080: Restore room state on reconnection
  useEffect(() => {
    const restoreRoomState = async () => {
      if (!room || !participant || !refetchRoom) return;

      try {
        // Refetch room data
        await refetchRoom();

        // Reload current round and selections
        const round = await getCurrentRound(room.id);
        if (round) {
          setCurrentRound(round);
          
          // Restore user's card selection
          const selection = await getCardSelection(round.id, participant.id);
          if (selection) {
            setSelectedCard(selection.card_value);
          }
          
          // Reload all selections
          const allSelections = await getCardSelections(round.id);
          const selectedIds = new Set(allSelections.map(s => s.participant_id));
          setSelectedParticipantIds(selectedIds);
          
          if (round.status === 'revealed') {
            setCardSelections(allSelections);
          }
        }
      } catch (error) {
        console.error('Failed to restore room state:', error);
      }
    };

    // T080: Monitor connection status and restore state on reconnection
    const unsubscribe = connectionMonitor.subscribe((status) => {
      if (status === 'connected' && room && participant) {
        // Restore state when reconnected
        restoreRoomState();
      }
    });

    return unsubscribe;
  }, [room, participant, refetchRoom]);

  // T048: Realtime callbacks
  const handleParticipantChange = useCallback(() => {
    if (refetchRoom) {
      refetchRoom();
    }
  }, [refetchRoom]);

  const handleCardSelectionChange = useCallback(async () => {
    // Update selected participant IDs for real-time status
    if (currentRound) {
      const selections = await getCardSelections(currentRound.id);
      const selectedIds = new Set(selections.map(s => s.participant_id));
      setSelectedParticipantIds(selectedIds);
    }
    
    // Refetch room data (includes participants count updates)
    if (refetchRoom) {
      refetchRoom();
    }
  }, [refetchRoom, currentRound]);

  const handleRoundChange = useCallback(async (payload: any) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const newRound = payload.new;
      setCurrentRound(newRound);
      
      // Reset selected card and selections when new round starts
      if (payload.eventType === 'INSERT') {
        setSelectedCard(null);
        setCardSelections([]);
      }
    }
  }, []);

  // T048: Setup realtime subscriptions
  useRealtime({
    roomId: room?.id || '',
    roundId: currentRound?.id,
    onParticipantChange: room ? handleParticipantChange : undefined,
    onCardSelectionChange: currentRound ? handleCardSelectionChange : undefined,
    onRoundChange: room ? handleRoundChange : undefined,
  });

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
          
          // Load all selections for revealed rounds
          if (round.status === 'revealed') {
            const allSelections = await getCardSelections(round.id);
            setCardSelections(allSelections);
          }
        }
        // No auto-start - owner will start first round manually
      }
    }
    fetchRound();
  }, [room, participant]);

  // Load card selections when round is revealed
  useEffect(() => {
    async function loadSelections() {
      if (currentRound) {
        const allSelections = await getCardSelections(currentRound.id);
        
        // Update card selections for revealed rounds
        if (currentRound.status === 'revealed') {
          setCardSelections(allSelections);
        }
        
        // Update selected participant IDs for participant list
        const selectedIds = new Set(allSelections.map(s => s.participant_id));
        setSelectedParticipantIds(selectedIds);
      }
    }
    loadSelections();
  }, [currentRound?.status, currentRound?.id]);

  // T052: Completion detection - check when selections change
  useEffect(() => {
    async function checkCompletion() {
      if (!room || !currentRound || currentRound.status !== 'selecting') {
        return;
      }

      try {
        // Get active participant IDs
        const activeParticipantIds = room.participants
          ?.filter((p: any) => p.is_active)
          .map((p: any) => p.id) || [];
        
        const result = await checkAllSelected(
          currentRound.id,
          activeParticipantIds
        );
        
        if (result.allSelected) {
          // FR-006: Auto-reveal when all users selected
          await calculateStatistics(currentRound.id);
          await updateRoundStatus(currentRound.id, 'revealed');
          
          // Load all selections for display
          const allSelections = await getCardSelections(currentRound.id);
          setCardSelections(allSelections);
          
          // Force refresh to show revealed state
          if (refetchRoom) {
            await refetchRoom();
          }
        }
      } catch (error) {
        console.error('Failed to check completion:', error);
      }
    }

    checkCompletion();
    // Check on room changes (triggered by Realtime card selections)
  }, [room, currentRound]);

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

  // T040: Handle card selection (implements FR-004) - one-time selection
  const handleCardSelect = async (cardValue: number) => {
    if (!currentRound || !participant || selectedCard !== null || selectingCard) return;
    
    setSelectingCard(true);
    try {
      await selectCard(currentRound.id, participant.id, cardValue);
      setSelectedCard(cardValue); // SC-003: Immediate visual feedback
    } catch (err) {
      console.error('Failed to select card:', err);
      alert('カードの選択に失敗しました。もう一度お試しください。');
    } finally {
      setSelectingCard(false);
    }
  };

  // T059: Handle new round start (implements FR-014)
  const handleStartNewRound = async () => {
    if (!room || startingRound) return;
    
    setStartingRound(true);
    try {
      // Start new round
      const newRound = await startRound(room.id);
      setCurrentRound(newRound);
      
      // T060: Reset card selection state
      setSelectedCard(null);
      setCardSelections([]);
      
      // Refresh room data
      if (refetchRoom) {
        await refetchRoom();
      }
    } catch (err) {
      console.error('Failed to start new round:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // User-friendly error message
      if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        alert('ラウンドを開始できませんでした。オーナー権限があるか確認してください。');
      } else {
        alert('ラウンドの開始に失敗しました。もう一度お試しください。');
      }
    } finally {
      setStartingRound(false);
    }
  };

  // Handle force reveal (owner closes voting early)
  const handleForceReveal = async () => {
    if (!currentRound || currentRound.status !== 'selecting') return;

    try {
      // Calculate statistics with current selections only
      await calculateStatistics(currentRound.id);
      await updateRoundStatus(currentRound.id, 'revealed');
      
      // Load all selections for display
      const allSelections = await getCardSelections(currentRound.id);
      setCardSelections(allSelections);
      
      // Force refresh to show revealed state
      if (refetchRoom) {
        await refetchRoom();
      }
    } catch (err) {
      console.error('Failed to force reveal:', err);
      throw err;
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

  // T038: Integrate CardSelector component / T056: Show ResultsView when revealed
  return (
    <Layout>
      <ReconnectionIndicator />
      <div style={{ padding: '20px' }}>
        {currentRound && (
          <h1 style={{ 
            fontSize: '32px', 
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            Round {currentRound.round_number}
          </h1>
        )}
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            margin: '0 0 5px 0',
            fontSize: '14px',
            color: '#666'
          }}>
            Room: {room.code}
          </p>
          <p style={{ 
            margin: 0,
            fontSize: '14px',
            color: '#666'
          }}>
            あなた: {participant.display_name}
          </p>
        </div>
        
        {!currentRound ? (
          <>
            {participant?.is_owner && <InvitationLink roomCode={room.code} />}
            <WaitingRoom
              participants={room.participants}
              isOwner={participant.is_owner}
              onStartGame={handleStartNewRound}
            />
          </>
        ) : (
          <>
            <div style={{ marginTop: '20px' }}>
              
              {currentRound.status === 'selecting' ? (
                <>
                  <CardSelector 
                    selectedCard={selectedCard}
                    onSelect={handleCardSelect}
                    disabled={selectedCard !== null}
                    loading={selectingCard}
                  />
                  {participant?.is_owner && (
                    <ForceRevealButton onForceReveal={handleForceReveal} />
                  )}
                </>
              ) : (
                <>
                  <ResultsView
                    round={currentRound}
                    participants={room.participants}
                    selections={cardSelections}
                  />
                  {participant?.is_owner && (
                    <>
                      <NewRoundButton onStartNewRound={handleStartNewRound} />
                      <InvitationLink roomCode={room.code} />
                    </>
                  )}
                </>
              )}
            </div>
            
            <div style={{ marginTop: '30px' }}>
              <ParticipantList
                participants={room.participants}
                currentRoundId={currentRound.id}
                selectedParticipantIds={selectedParticipantIds}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
