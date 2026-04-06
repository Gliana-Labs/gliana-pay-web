// Worker URL configuration
// Use relative URLs - works for both client and server with Service binding
export const WORKER_URL = ''; // relative URL (client-side)
export const WORKER_URL_SERVER = ''; // relative URL (server-side)
export const WORKER_HOST = ''; // for WebSocket

// Solana Network configuration
// Set VITE_SOLANA_RPC in Cloudflare Pages (full URL, different per environment)
export const SOLANA_RPC = import.meta.env.VITE_SOLANA_RPC;
export const USDC_MINT = import.meta.env.VITE_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Public base URL
export const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || 'https://glianapay.com';