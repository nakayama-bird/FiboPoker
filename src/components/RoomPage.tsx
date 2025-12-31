import { useParams } from 'react-router-dom';

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  
  return (
    <div>
      <h1>Room: {code}</h1>
      <p>Room functionality will be implemented in Phase 3</p>
    </div>
  );
}
