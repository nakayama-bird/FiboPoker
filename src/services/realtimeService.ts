import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type ParticipantCallback = (payload: any) => void;
type CardSelectionCallback = (payload: any) => void;
type RoundCallback = (payload: any) => void;

// T044: Subscribe to participants changes (implements FR-012 realtime)
export function subscribeToParticipants(
  roomId: string,
  callback: ParticipantCallback
): RealtimeChannel {
  const channel = supabase
    .channel(`participants:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

// T045: Subscribe to card selections changes (implements FR-006)
export function subscribeToCardSelections(
  roundId: string,
  callback: CardSelectionCallback
): RealtimeChannel {
  const channel = supabase
    .channel(`card_selections:${roundId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'card_selections',
        filter: `round_id=eq.${roundId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

// T046: Subscribe to rounds changes (implements FR-007, FR-008)
export function subscribeToRounds(
  roomId: string,
  callback: RoundCallback
): RealtimeChannel {
  const channel = supabase
    .channel(`rounds:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rounds',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

// Unsubscribe from a channel
export function unsubscribeChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
