import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/roomService';
import Layout from './Layout';
import styles from '../styles/HomePage.module.css';

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
      <div className={styles.container}>
        <h1 className={styles.title}>Fibonacci Poker</h1>
        <p className={styles.subtitle}>アジャイル開発のための見積もりツール</p>
        
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className={styles.createButton}
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
        
        {error && (
          <p style={{ color: '#dc2626', marginTop: '1rem', textAlign: 'center' }}>{error}</p>
        )}
      </div>
    </Layout>
  );
}
