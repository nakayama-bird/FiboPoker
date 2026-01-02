import { supabase } from './supabase';

interface JoinRoomParams {
  roomId: string;
  displayName: string;
}

interface Participant {
  id: string;
  room_id: string;
  session_id: string;
  display_name: string;
  is_active: boolean;
  is_owner: boolean;
  created_at: string;
}

// T030: Join room as participant (implements FR-011)
export async function joinRoom({ roomId, displayName }: JoinRoomParams): Promise<Participant> {
  // T029: Get current user session (Anonymous Auth)
  let { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Sign in anonymously if not authenticated
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError || !authData.user) {
      throw new Error(`Failed to authenticate: ${authError?.message}`);
    }
    
    user = authData.user;
  }

  // Check if participant already exists
  const { data: existing } = await supabase
    .from('participants')
    .select()
    .eq('room_id', roomId)
    .eq('session_id', user.id)
    .single();

  if (existing) {
    // Update existing participant  
    const { data, error: updateError } = await supabase
      .from('participants')
      .update({
        display_name: displayName,
        is_active: true,
      } as never)
      .eq('id', (existing as any).id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update participant: ${updateError.message}`);
    }

    return data;
  }

  // Check if this is the first participant (will be owner)
  const { count } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId);

  const isOwner = count === 0;

  // Insert new participant
  const { data, error } = await supabase
    .from('participants')
    .insert({
      room_id: roomId,
      session_id: user.id,
      display_name: displayName,
      is_active: true,
      is_owner: isOwner,
    } as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to join room: ${error.message}`);
  }

  return data;
}

// Get current participant in a room
export async function getCurrentParticipant(roomId: string): Promise<Participant | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('participants')
    .select()
    .eq('room_id', roomId)
    .eq('session_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get participant: ${error.message}`);
  }

  return data;
}
