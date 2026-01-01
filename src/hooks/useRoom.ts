import { useState, useEffect } from 'react';
import { getRoomByCode } from '../services/roomService';

interface Room {
  id: string;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
  participants: Array<{
    id: string;
    display_name: string;
    is_active: boolean;
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

// T026: Custom hook for room state management
export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadRoom() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getRoomByCode(code);
        
        if (mounted) {
          if (!data) {
            setError('Room not found');
          } else {
            setRoom(data);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load room');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (code) {
      loadRoom();
    }

    return () => {
      mounted = false;
    };
  }, [code]);

  return { room, loading, error, refetch: () => getRoomByCode(code).then(setRoom) };
}
