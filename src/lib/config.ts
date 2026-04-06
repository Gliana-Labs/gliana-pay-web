// =============================================================================
// WORKER URL CONFIGURATION
// Relative URLs work for both client and server via Service binding
// =============================================================================
export const WORKER_URL = ''; // client-side fetch (relative)
export const WORKER_URL_SERVER = ''; // server-side fetch (relative)
export const HOST = ''; // WebSocket host

// =============================================================================
// CLOUDFLARE PAGES ENVIRONMENT VARIABLES
// Set these in: Dashboard → Pages → project → Settings → Environment Variables
//
// IMPORTANT: Set for BOTH "Production" AND "Preview" environments
// These VITE_* vars are baked into the client bundle at build time.
// For secrets visible to client, use a proxy through the worker.
// =============================================================================

// Solana mainnet RPC endpoint
// Example: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
// Warning: This URL is visible in client bundle - consider proxying through worker
export const SOLANA_RPC = import.meta.env.VITE_SOLANA_RPC;

// USDC mint address on Solana mainnet
export const USDC_MINT = import.meta.env.VITE_USDC_MINT;

// Public base URL for the deployed site (no trailing slash)
export const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL;

// Cloudflare Turnstile site key (public, safe for client)
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
