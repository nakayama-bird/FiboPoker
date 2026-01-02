-- Enable Realtime for rounds table
-- This ensures INSERT/UPDATE/DELETE events are broadcast to connected clients

-- Check current publication tables
-- Run this query to verify:
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime';

-- Set REPLICA IDENTITY to FULL for rounds table
-- This is required for Realtime to broadcast all column values in events
ALTER TABLE rounds REPLICA IDENTITY FULL;

-- Add rounds table to realtime publication if not already added
-- This may error if already added, which is safe to ignore
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
