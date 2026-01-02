import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      // Redirect to room page with the code
      navigate(`/room/${code}`, { replace: true });
    } else {
      // No code provided, redirect to home
      navigate('/', { replace: true });
    }
  }, [code, navigate]);

  return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p>リダイレクト中...</p>
      </div>
    </Layout>
  );
}
