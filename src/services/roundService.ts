import { supabase } from './supabase';

interface Round {
  id: string;
  room_id: string;
  round_number: number;
  status: string;
  max_value: number | null;
  min_value: number | null;
  median_value: number | null;
  avg_value: number | null;
  revealed_at: string | null;
  created_at: string;
}

// T033: Start new round (implements FR-014)
export async function startRound(roomId: string): Promise<Round> {
  // Get the last round number
  const { data: lastRound } = await supabase
    .from('rounds')
    .select('round_number')
    .eq('room_id', roomId)
    .order('round_number', { ascending: false })
    .limit(1)
    .single();

  const nextRoundNumber = ((lastRound as any)?.round_number ?? 0) + 1;

  // Create new round
  const { data, error } = await supabase
    .from('rounds')
    .insert({
      room_id: roomId,
      round_number: nextRoundNumber,
      status: 'selecting',
    } as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to start round: ${error.message}`);
  }

  return data;
}

// T050: Trigger statistics calculation (calls PostgreSQL function)
export async function calculateStatistics(roundId: string): Promise<void> {
  const { error } = await supabase.rpc('calculate_round_statistics', {
    p_round_id: roundId,
  } as any);

  if (error) {
    throw new Error(`Failed to calculate statistics: ${error.message}`);
  }
}

// T051: Update round status to 'revealed'
export async function updateRoundStatus(
  roundId: string,
  status: 'selecting' | 'revealed'
): Promise<void> {
  const { error } = await (supabase
    .from('rounds')
    .update({ status } as never) as any)
    .eq('id', roundId);

  if (error) {
    throw new Error(`Failed to update round status: ${error.message}`);
  }
}

// Get current round for a room
export async function getCurrentRound(roomId: string): Promise<Round | null> {
  const { data, error } = await supabase
    .from('rounds')
    .select()
    .eq('room_id', roomId)
    .order('round_number', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get current round: ${error.message}`);
  }

  return data;
}
