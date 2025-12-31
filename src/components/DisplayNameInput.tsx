import { useState, FormEvent } from 'react';

interface DisplayNameInputProps {
  onSubmit: (displayName: string) => void;
  loading?: boolean;
}

// T031: Display name input component (implements FR-011)
export default function DisplayNameInput({ onSubmit, loading = false }: DisplayNameInputProps) {
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      onSubmit(displayName.trim());
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px' }}>
      <h2>Join Room</h2>
      <p>Enter your display name to join this room</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
          required
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
        />
        
        <button
          type="submit"
          disabled={loading || !displayName.trim()}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            cursor: loading || !displayName.trim() ? 'not-allowed' : 'pointer',
            backgroundColor: loading || !displayName.trim() ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </form>
    </div>
  );
}
