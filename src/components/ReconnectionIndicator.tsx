import { useEffect, useState } from 'react';
import { connectionMonitor } from '../services/supabase';
import type { ConnectionStatus } from '../services/supabase';
import styles from './ReconnectionIndicator.module.css';

export const ReconnectionIndicator: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(connectionMonitor.getStatus());

  useEffect(() => {
    const unsubscribe = connectionMonitor.subscribe(setStatus);
    return unsubscribe;
  }, []);

  if (status === 'connected') {
    return null; // No indicator when connected
  }

  return (
    <div className={styles.indicator} data-status={status}>
      <div className={styles.icon}>
        {status === 'connecting' ? '🔄' : '⚠️'}
      </div>
      <div className={styles.message}>
        {status === 'connecting' ? '再接続中...' : '接続が切断されました'}
      </div>
    </div>
  );
};
