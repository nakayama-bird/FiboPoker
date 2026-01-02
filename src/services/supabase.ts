import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Reconnection state management
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

class ConnectionMonitor {
  private status: ConnectionStatus = 'connected';
  private listeners: Array<(status: ConnectionStatus) => void> = [];
  private reconnectTimer: number | null = null;
  private statusCheckInterval: number | null = null;

  constructor() {
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring() {
    // Check connection status periodically
    this.statusCheckInterval = setInterval(() => {
      this.checkConnectionStatus();
    }, 5000); // Check every 5 seconds
  }

  private async checkConnectionStatus() {
    try {
      // Only check if we're not already connected
      if (this.status === 'connected') {
        return;
      }

      // Try a simple query to check connection
      const { error } = await supabase.from('rooms').select('id').limit(1);
      
      if (error) {
        // Check for network-related errors
        const isNetworkError = 
          error.message.includes('network') ||
          error.message.includes('fetch') ||
          error.message.includes('Failed to fetch');
        
        if (isNetworkError) {
          this.updateStatus('disconnected');
          this.attemptReconnect();
        }
      } else {
        // Successfully connected
        this.updateStatus('connected');
      }
    } catch (error) {
      // Catch block for network errors
      this.updateStatus('disconnected');
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectTimer) {
      return; // Already attempting to reconnect
    }

    this.updateStatus('connecting');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.checkConnectionStatus();
    }, 2000); // Retry after 2 seconds
  }

  private updateStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public subscribe(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public cleanup() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }
}

export const connectionMonitor = new ConnectionMonitor();
