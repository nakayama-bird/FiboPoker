import { useEffect } from 'react';
import {
  subscribeToParticipants,
  subscribeToCardSelections,
  subscribeToRounds,
  unsubscribeChannel,
} from '../services/realtimeService';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeProps {
  roomId: string;
  roundId?: string;
  onParticipantChange?: () => void;
  onCardSelectionChange?: () => void;
  onRoundChange?: (payload: any) => void;
}

// T047: useRealtime() custom hook for realtime subscriptions
export function useRealtime({
  roomId,
  roundId,
  onParticipantChange,
  onCardSelectionChange,
  onRoundChange,
}: UseRealtimeProps) {
  useEffect(() => {
    const channels: RealtimeChannel[] = [];

    // Subscribe to participants
    if (onParticipantChange) {
      const participantChannel = subscribeToParticipants(roomId, () => {
        onParticipantChange();
      });
      channels.push(participantChannel);
    }

    // Subscribe to card selections
    if (onCardSelectionChange && roundId) {
      const cardSelectionChannel = subscribeToCardSelections(roundId, () => {
        onCardSelectionChange();
      });
      channels.push(cardSelectionChannel);
    }

    // Subscribe to rounds
    if (onRoundChange) {
      const roundChannel = subscribeToRounds(roomId, (payload) => {
        onRoundChange(payload);
      });
      channels.push(roundChannel);
    }

    // Cleanup on unmount
    return () => {
      channels.forEach((channel) => {
        unsubscribeChannel(channel);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roundId]);
}
