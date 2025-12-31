-- Cleanup inactive rooms function
-- This function is designed to be called by pg_cron every 5 minutes
-- It deletes rooms that have no active participants and haven't been updated in 30 minutes

-- Schedule with pg_cron (run this in Supabase SQL Editor after migration):
-- SELECT cron.schedule(
--   'cleanup-inactive-rooms',
--   '*/5 * * * *',
--   $$ SELECT cleanup_inactive_rooms(); $$
-- );

-- The cleanup_inactive_rooms() function is already created in 001_initial_schema.sql
-- This file is for documentation and reference purposes
