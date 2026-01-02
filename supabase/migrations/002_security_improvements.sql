-- Security improvements: Row Level Security (RLS) policies
-- Feature: 007-security-improvements
-- Tasks: T106-T109
-- Created: 2026-01-02

-- ============================================================================
-- RLS Policy Improvements
-- ============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all to read rooms" ON rooms;
DROP POLICY IF EXISTS "Allow all to insert rooms" ON rooms;
DROP POLICY IF EXISTS "Allow all to update rooms" ON rooms;

DROP POLICY IF EXISTS "Allow all to read participants" ON participants;
DROP POLICY IF EXISTS "Allow all to insert participants" ON participants;
DROP POLICY IF EXISTS "Allow all to update participants" ON participants;

DROP POLICY IF EXISTS "Allow all to read rounds" ON rounds;
DROP POLICY IF EXISTS "Allow all to insert rounds" ON rounds;
DROP POLICY IF EXISTS "Allow all to update rounds" ON rounds;

-- ============================================================================
-- T106: RLS for rooms table
-- ============================================================================

-- Users can read rooms they are participating in
CREATE POLICY "Users can read rooms they participate in"
  ON rooms FOR SELECT
  USING (
    id IN (
      SELECT room_id 
      FROM participants 
      WHERE session_id = auth.uid()
      AND is_active = true
    )
  );

-- Anyone can create a new room
CREATE POLICY "Anyone can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (true);

-- Room owners can update their room status
CREATE POLICY "Owners can update their rooms"
  ON rooms FOR UPDATE
  USING (
    id IN (
      SELECT room_id 
      FROM participants 
      WHERE session_id = auth.uid()
      AND is_owner = true
    )
  );

-- Room owners can delete their rooms
CREATE POLICY "Owners can delete their rooms"
  ON rooms FOR DELETE
  USING (
    id IN (
      SELECT room_id 
      FROM participants 
      WHERE session_id = auth.uid()
      AND is_owner = true
    )
  );

-- ============================================================================
-- T107: RLS for participants table
-- ============================================================================

-- Users can read participants in rooms they've joined
CREATE POLICY "Users can read participants in their rooms"
  ON participants FOR SELECT
  USING (
    room_id IN (
      SELECT room_id 
      FROM participants 
      WHERE session_id = auth.uid()
    )
  );

-- Users can join rooms (create participant records)
CREATE POLICY "Users can join rooms"
  ON participants FOR INSERT
  WITH CHECK (session_id = auth.uid());

-- Users can update their own participant record
CREATE POLICY "Users can update their own participant record"
  ON participants FOR UPDATE
  USING (session_id = auth.uid());

-- Users can delete their own participant record (leave room)
CREATE POLICY "Users can delete their own participant record"
  ON participants FOR DELETE
  USING (session_id = auth.uid());

-- ============================================================================
-- T108: RLS for rounds table
-- ============================================================================

-- Users can read rounds in rooms they've joined
CREATE POLICY "Users can read rounds in their rooms"
  ON rounds FOR SELECT
  USING (
    room_id IN (
      SELECT room_id 
      FROM participants 
      WHERE session_id = auth.uid()
    )
  );

-- Only room owners can create rounds
CREATE POLICY "Room owners can create rounds"
  ON rounds FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT room_id 
      FROM participants 
      WHERE session_id = auth.uid()
      AND is_owner = true
    )
  );

-- Only room owners can update rounds (reveal, calculate stats)
CREATE POLICY "Room owners can update rounds"
  ON rounds FOR UPDATE
  USING (
    room_id IN (
      SELECT room_id 
      FROM participants 
      WHERE session_id = auth.uid()
      AND is_owner = true
    )
  );

-- ============================================================================
-- T109: RLS for card_selections table
-- ============================================================================

-- Keep existing read policy (all participants can see selections)
-- This is already restrictive enough - selections are only visible
-- within a room context through the rounds relationship

-- Keep existing insert policy (users can only insert their own selections)
-- Already implemented correctly in 001_initial_schema.sql

-- Keep existing update policy (users can only update their own selections)
-- Already implemented correctly in 001_initial_schema.sql

-- Add delete policy: users can delete their own selections
CREATE POLICY "Users can delete their own card_selections"
  ON card_selections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = card_selections.participant_id
      AND participants.session_id = auth.uid()
    )
  );

-- ============================================================================
-- Additional Security Constraints
-- ============================================================================

-- T113: Add database constraints for input validation
ALTER TABLE participants
  ADD CONSTRAINT display_name_length
  CHECK (char_length(display_name) BETWEEN 1 AND 50);

-- Ensure room codes are lowercase alphanumeric
ALTER TABLE rooms
  ADD CONSTRAINT room_code_format
  CHECK (code ~ '^[a-z0-9]{8}$');

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON POLICY "Users can read rooms they participate in" ON rooms 
  IS 'Restricts room visibility to participants only';

COMMENT ON POLICY "Users can read participants in their rooms" ON participants 
  IS 'Prevents snooping on other rooms';

COMMENT ON POLICY "Users can read rounds in their rooms" ON rounds 
  IS 'Ensures round data privacy per room';

COMMENT ON POLICY "Room owners can create rounds" ON rounds 
  IS 'Only owners can start new rounds (prevents abuse)';

COMMENT ON CONSTRAINT display_name_length ON participants 
  IS 'Enforces 1-50 character limit for display names';

COMMENT ON CONSTRAINT room_code_format ON rooms 
  IS 'Ensures room codes are 8-character lowercase alphanumeric';
