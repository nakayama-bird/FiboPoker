-- Rollback security improvements from 002_security_improvements.sql
-- Reason: After analysis, the additional RLS policies do not provide meaningful
--         security improvements for FiboPoker's design (room codes act as passwords)
-- Created: 2026-01-03

-- ============================================================================
-- Remove policies added in 002
-- ============================================================================

-- Remove rooms policies from 002
DROP POLICY IF EXISTS "Users can read rooms they participate in" ON rooms;
DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
DROP POLICY IF EXISTS "Owners can update their rooms" ON rooms;
DROP POLICY IF EXISTS "Owners can delete their rooms" ON rooms;

-- Remove participants policies from 002
DROP POLICY IF EXISTS "Users can read participants in their rooms" ON participants;
DROP POLICY IF EXISTS "Anyone can read participants" ON participants;
DROP POLICY IF EXISTS "Users can join rooms" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can delete their own participant record" ON participants;

-- Remove rounds policies from 002
DROP POLICY IF EXISTS "Users can read rounds in their rooms" ON rounds;
DROP POLICY IF EXISTS "Room owners can create rounds" ON rounds;
DROP POLICY IF EXISTS "Room owners can update rounds" ON rounds;

-- Remove card_selections policy from 002
DROP POLICY IF EXISTS "Users can delete their own card_selections" ON card_selections;

-- Remove constraints from 002
ALTER TABLE participants DROP CONSTRAINT IF EXISTS display_name_length;
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS room_code_format;

-- ============================================================================
-- Restore original policies from 001_initial_schema.sql
-- ============================================================================

-- Restore rooms policies
CREATE POLICY "Allow all to read rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert rooms" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update rooms" ON rooms
  FOR UPDATE USING (true);

-- Restore participants policies
CREATE POLICY "Allow all to read participants" ON participants
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert participants" ON participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update participants" ON participants
  FOR UPDATE USING (true);

-- Restore rounds policies
CREATE POLICY "Allow all to read rounds" ON rounds
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert rounds" ON rounds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update rounds" ON rounds
  FOR UPDATE USING (true);

-- Note: card_selections policies from 001 are preserved (they were not dropped in 002)
-- The original policies already provide sufficient security:
-- - Users can only insert/update their own card_selections
-- - This is enforced via participant_id and session_id checks

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON POLICY "Allow all to read rooms" ON rooms 
  IS 'Permissive policy suitable for Planning Poker where room codes act as access control';

COMMENT ON POLICY "Allow all to read participants" ON participants 
  IS 'Permissive policy suitable for collaborative Planning Poker sessions';

COMMENT ON POLICY "Allow all to read rounds" ON rounds 
  IS 'Permissive policy suitable for Planning Poker game flow';
