import { get } from 'svelte/store';
import { walletStore } from '@aztemi/svelte-on-solana-wallet-adapter-core';

/**
 * Get the currently connected wallet address as a string, or null if not connected.
 */
export function getWalletAddress(): string | null {
  const store = get(walletStore);
  return store.publicKey?.toBase58() || null;
}

/**
 * Sign a message using the connected wallet adapter.
 * Returns { signature, message } or null if signing fails.
 */
export async function signAuthMessage(messageText: string): Promise<{ signature: string; message: string } | null> {
  const store = get(walletStore);

  if (!store.publicKey || !store.signMessage) {
    console.error('Wallet not connected or does not support signMessage');
    return null;
  }

  try {
    const encodedMessage = new TextEncoder().encode(messageText);
    const signatureBytes = await store.signMessage(encodedMessage);

    if (signatureBytes && signatureBytes.length > 0) {
      const signatureArray = Array.from(signatureBytes);
      const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
      return { signature: signatureBase64, message: messageText };
    }

    return null;
  } catch (e) {
    console.error('Message signing failed:', e);
    return null;
  }
}

/**
 * Helper to create an Authorization header using wallet signature.
 * Used by dashboard and settings for authenticated API calls.
 */
export async function getAuthHeader(): Promise<string | null> {
  const address = getWalletAddress();
  if (!address) return null;

  const timestamp = Date.now();
  const message = `Authenticate ${timestamp}`;
  const result = await signAuthMessage(message);

  if (!result) return null;

  return `Bearer ${address}:${result.signature}`;
}
