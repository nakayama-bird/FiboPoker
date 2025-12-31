-- Initial schema for Fibonacci Poker application
-- Feature: 001-fibo-poker
-- Created: 2025-12-31

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. rooms table
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(8) UNIQUE NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_updated_at ON rooms(updated_at);

-- 2. participants table
CREATE TABLE participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  display_name varchar(50) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_participants_room_id ON participants(room_id);
CREATE INDEX idx_participants_session_id ON participants(session_id);
CREATE UNIQUE INDEX idx_participants_unique ON participants(room_id, session_id);

-- 3. rounds table
CREATE TABLE rounds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'selecting',
  max_value integer,
  min_value integer,
  median_value numeric(5,2),
  avg_value numeric(5,2),
  revealed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rounds_room_id ON rounds(room_id);
CREATE UNIQUE INDEX idx_rounds_unique ON rounds(room_id, round_number);

-- 4. card_selections table
CREATE TABLE card_selections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  card_value integer NOT NULL CHECK (card_value IN (1, 2, 3, 5, 8, 13, 21)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_selections_round_id ON card_selections(round_id);
CREATE INDEX idx_card_selections_participant_id ON card_selections(participant_id);
CREATE UNIQUE INDEX idx_card_selections_unique ON card_selections(round_id, participant_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- 1. Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Calculate round statistics
CREATE OR REPLACE FUNCTION calculate_round_statistics(p_round_id uuid)
RETURNS void AS $$
DECLARE
  v_max integer;
  v_min integer;
  v_median numeric;
  v_avg numeric;
BEGIN
  SELECT 
    max(card_value),
    min(card_value),
    percentile_cont(0.5) WITHIN GROUP (ORDER BY card_value),
    avg(card_value)
  INTO v_max, v_min, v_median, v_avg
  FROM card_selections
  WHERE round_id = p_round_id;
  
  UPDATE rounds
  SET 
    status = 'revealed',
    max_value = v_max,
    min_value = v_min,
    median_value = v_median,
    avg_value = v_avg,
    revealed_at = now()
  WHERE id = p_round_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Cleanup inactive rooms (called by pg_cron)
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms
  WHERE id IN (
    SELECT r.id
    FROM rooms r
    LEFT JOIN participants p ON r.id = p.room_id AND p.is_active = true
    WHERE r.updated_at < now() - interval '30 minutes'
    AND p.id IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for rooms table
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms (all users can read/write)
CREATE POLICY "Allow all to read rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert rooms" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update rooms" ON rooms
  FOR UPDATE USING (true);

-- RLS Policies for participants (users can manage their own participant record)
CREATE POLICY "Allow all to read participants" ON participants
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert participants" ON participants
  FOR INSERT WITH CHECK (auth.uid() = session_id);

CREATE POLICY "Allow users to update their own participant" ON participants
  FOR UPDATE USING (auth.uid() = session_id);

-- RLS Policies for rounds (all users can read/write)
CREATE POLICY "Allow all to read rounds" ON rounds
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert rounds" ON rounds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update rounds" ON rounds
  FOR UPDATE USING (true);

-- RLS Policies for card_selections (users can only modify their own selections)
CREATE POLICY "Allow all to read card_selections" ON card_selections
  FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own card_selections" ON card_selections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = card_selections.participant_id
      AND participants.session_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to update their own card_selections" ON card_selections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = card_selections.participant_id
      AND participants.session_id = auth.uid()
    )
  );

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================

-- Enable Realtime for required tables
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE card_selections;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- Generate room code function (used by application)
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS varchar(8) AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result varchar(8) := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
