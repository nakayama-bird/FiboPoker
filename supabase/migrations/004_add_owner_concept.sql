-- Add owner/member concept to participants
-- Phase 4-5: Owner controls game start

-- Add is_owner column to participants
ALTER TABLE participants ADD COLUMN is_owner BOOLEAN NOT NULL DEFAULT false;

-- Create index for owner lookups
CREATE INDEX idx_participants_owner ON participants(room_id, is_owner) WHERE is_owner = true;

-- Update RLS policies for rounds - only owners can start rounds
DROP POLICY IF EXISTS "Allow room participants to insert rounds" ON rounds;
DROP POLICY IF EXISTS "Allow room participants to update rounds" ON rounds;

CREATE POLICY "Allow room owners to insert rounds" ON rounds
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.room_id = rounds.room_id
      AND participants.session_id = auth.uid()
      AND participants.is_active = true
      AND participants.is_owner = true
    )
  );

CREATE POLICY "Allow room owners to update rounds" ON rounds
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.room_id = rounds.room_id
      AND participants.session_id = auth.uid()
      AND participants.is_active = true
      AND participants.is_owner = true
    )
  );

COMMENT ON COLUMN participants.is_owner IS 'Room creator who can start rounds';
