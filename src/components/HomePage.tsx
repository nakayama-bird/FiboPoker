import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/roomService';
import Layout from './Layout';

// T027: HomePage component with "Create Room" button (implements FR-001)
export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // T028: Room creation flow (SC-001: 30秒以内に完了)
  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const room = await createRoom();
      
      // Redirect to room page
      navigate(`/room/${room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h1>Fibonacci Planning Poker</h1>
        <p>Create a room to start estimating with your team</p>
        
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
        
        {error && (
          <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>
        )}
      </div>
    </Layout>
  );
}
