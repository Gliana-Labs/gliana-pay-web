/**
 * GlianaPay Shared Types
 * Shared between worker and web repositories
 */

export interface Streamer {
  id: number;
  slug: string;
  wallet: string;
  name: string;
  created_at: string;
}

export interface Donation {
  id: number;
  streamer_id: number;
  tx_hash: string;
  amount: number; // in lamports
  sender: string;
  message: string;
  timestamp: string;
}

export interface AlertSettings {
  id: number;
  streamer_id: number;
  sound_url: string;
  image_url: string;
  min_amount: number; // minimum tip to trigger alert
  created_at: string;
  updated_at: string;
}

// WebSocket message types
export interface WSTipEvent {
  type: 'tip';
  data: {
    tx_hash: string;
    amount: number;
    sender: string;
    sender_name?: string;
    message: string;
    timestamp: string;
    streamer_slug: string;
  };
}

export interface WSJoinEvent {
  type: 'join';
  data: {
    streamer_slug: string;
  };
}

export interface WSMessage {
  type: 'tip' | 'join' | 'welcome' | 'error';
  data?: unknown;
  message?: string;
}

// Helius webhook payload (simplified)
export interface HeliusWebhookPayload {
  transaction: {
    signature: string;
    fee: number;
    slot: number;
  };
  transactions: Array<{
    signature: string;
    fee: number;
    slot: number;
    transaction: {
      message: {
        instructions: Array<{
          parsed?: {
            info?: {
              amount?: number;
              destination?: string;
              source?: string;
            };
          };
        }>;
      };
    };
  }>;
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Tipping page data
export interface StreamerPageData {
  streamer: Streamer;
  settings: AlertSettings | null;
}

// QR Code generation request
export interface CreateQRRequest {
  recipient: string;
  amount: number;
  reference?: string;
  label?: string;
  message?: string;
}
