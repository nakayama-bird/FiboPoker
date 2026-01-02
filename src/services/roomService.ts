import { supabase } from './supabase';

interface CreateRoomResponse {
  id: string;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface GetRoomResponse extends CreateRoomResponse {
  participants: Array<{
    id: string;
    display_name: string;
    is_active: boolean;
    is_owner: boolean;
  }>;
  rounds: Array<{
    id: string;
    round_number: number;
    status: string;
    max_value: number | null;
    min_value: number | null;
    median_value: number | null;
    avg_value: number | null;
  }>;
}

// T024: Create room with auto-generated code (implements FR-001, FR-002)
export async function createRoom(): Promise<CreateRoomResponse> {
  // Generate room code using PostgreSQL function
  const { data: codeData, error: codeError } = await supabase.rpc('generate_room_code');
  
  if (codeError) {
    throw new Error(`Failed to generate room code: ${codeError.message}`);
  }

  // Insert new room
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      code: codeData as string,
      status: 'active',
    } as any)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create room: ${error.message}`);
  }

  return data;
}

// T025: Get room by code with participants and rounds
export async function getRoomByCode(code: string): Promise<GetRoomResponse | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      participants(*),
      rounds(*)
    `)
    .eq('code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to get room: ${error.message}`);
  }

  return data as GetRoomResponse;
}
