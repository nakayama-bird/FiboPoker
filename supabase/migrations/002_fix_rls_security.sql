-- Fix RLS security issues
-- Feature: 001-fibo-poker
-- Created: 2026-01-01

-- ============================================================================
-- FIX: Restrict rounds table write access
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow all to insert rounds" ON rounds;
DROP POLICY IF EXISTS "Allow all to update rounds" ON rounds;

-- Only allow participants of the room to create rounds
CREATE POLICY "Allow room participants to insert rounds" ON rounds
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.room_id = rounds.room_id
      AND participants.session_id = auth.uid()
      AND participants.is_active = true
    )
  );

-- Only allow participants of the room to update rounds
CREATE POLICY "Allow room participants to update rounds" ON rounds
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.room_id = rounds.room_id
      AND participants.session_id = auth.uid()
      AND participants.is_active = true
    )
  );

-- ============================================================================
-- FIX: Add validation constraints
-- ============================================================================

-- Ensure display_name is not empty or only whitespace
ALTER TABLE participants
  ADD CONSTRAINT participants_display_name_not_empty 
  CHECK (trim(display_name) != '' AND length(trim(display_name)) >= 1);

-- Ensure display_name length is reasonable (1-50 chars)
ALTER TABLE participants
  ADD CONSTRAINT participants_display_name_length
  CHECK (length(trim(display_name)) <= 50);

-- ============================================================================
-- FIX: Add rate limiting hint (requires application-level implementation)
-- ============================================================================

-- Add comment for future rate limiting implementation
COMMENT ON TABLE rooms IS 'Rate limit: Max 10 rooms per IP per hour (implement in application layer or Supabase Edge Functions)';
COMMENT ON TABLE participants IS 'Rate limit: Max 5 joins per session per minute (implement in application layer)';
