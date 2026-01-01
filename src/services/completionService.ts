import { supabase } from './supabase';
import { getCardSelections } from './cardSelectionService';

interface CompletionCheckResult {
  allSelected: boolean;
  totalParticipants: number;
  selectedCount: number;
}

// T050: Check if all participants have selected cards (implements FR-006)
export async function checkAllSelected(
  roundId: string,
  activeParticipantIds: string[]
): Promise<CompletionCheckResult> {
  // Get all card selections for this round
  const selections = await getCardSelections(roundId);
  
  // Count how many active participants have selected
  const selectedParticipantIds = new Set(selections.map(s => s.participant_id));
  const selectedCount = activeParticipantIds.filter(id => 
    selectedParticipantIds.has(id)
  ).length;
  
  const allSelected = selectedCount === activeParticipantIds.length && activeParticipantIds.length > 0;
  
  return {
    allSelected,
    totalParticipants: activeParticipantIds.length,
    selectedCount,
  };
}

// T051: Calculate round statistics using PostgreSQL function
export async function calculateRoundStatistics(roundId: string): Promise<void> {
  const { error } = await supabase.rpc('calculate_round_statistics', {
    p_round_id: roundId,
  } as any);
  
  if (error) {
    throw new Error(`Failed to calculate statistics: ${error.message}`);
  }
}

// T052: Reveal round results (update status to 'revealed')
export async function revealRound(roundId: string): Promise<void> {
  const { error } = await supabase
    .from('rounds')
    .update({
      status: 'revealed',
      revealed_at: new Date().toISOString(),
    } as never)
    .eq('id', roundId);
  
  if (error) {
    throw new Error(`Failed to reveal round: ${error.message}`);
  }
}

// Combined function: Calculate statistics and reveal
export async function completeRound(roundId: string): Promise<void> {
  await calculateRoundStatistics(roundId);
  await revealRound(roundId);
}
