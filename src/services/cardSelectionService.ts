import { supabase } from './supabase';

interface CardSelection {
  id: string;
  round_id: string;
  participant_id: string;
  card_value: number;
  created_at: string;
}

// T034: Select card (implements FR-004)
export async function selectCard(
  roundId: string,
  participantId: string,
  cardValue: number
): Promise<CardSelection> {
  // UPSERT: insert or update if exists
  const { data, error } = await supabase
    .from('card_selections')
    .upsert({
      round_id: roundId,
      participant_id: participantId,
      card_value: cardValue,
    } as any, {
      onConflict: 'round_id,participant_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to select card: ${error.message}`);
  }

  return data;
}

// T035: Update card selection (implements FR-005)
export async function updateCard(
  roundId: string,
  participantId: string,
  cardValue: number
): Promise<CardSelection> {
  // Same as selectCard due to UPSERT
  return selectCard(roundId, participantId, cardValue);
}

// Get card selection for a participant in a round
export async function getCardSelection(
  roundId: string,
  participantId: string
): Promise<CardSelection | null> {
  const { data, error } = await supabase
    .from('card_selections')
    .select()
    .eq('round_id', roundId)
    .eq('participant_id', participantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get card selection: ${error.message}`);
  }

  return data;
}

// Get all card selections for a round
export async function getCardSelections(roundId: string): Promise<CardSelection[]> {
  const { data, error } = await supabase
    .from('card_selections')
    .select()
    .eq('round_id', roundId);

  if (error) {
    throw new Error(`Failed to get card selections: ${error.message}`);
  }

  return data || [];
}
