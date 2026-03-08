import { writable } from 'svelte/store';

export interface WalletInfo {
  name: string;
  icon: string;
  provider: any;
}

export const connectedWallet = writable<string>('');
export const walletName = writable<string>('');

// Detect available wallets
export function getAvailableWallets(): WalletInfo[] {
  if (typeof window === 'undefined') return [];

  const wallets: WalletInfo[] = [];

  // Phantom (browser extension or mobile in-app browser)
  if ((window as any).phantom?.solana?.isPhantom) {
    wallets.push({
      name: 'Phantom',
      icon: 'https://phantom.app/favicon.ico',
      provider: (window as any).phantom.solana
    });
  }

  // Solflare - use solflare.solana for the provider
  if ((window as any).solflare?.solana?.isSolflare || (window as any).solflare?.isSolflare) {
    wallets.push({
      name: 'Solflare',
      icon: 'https://solflare.com/favicon.ico',
      provider: (window as any).solflare.solana || (window as any).solflare
    });
  }

  // Ledger
  if ((window as any).ledger?.solana) {
    wallets.push({
      name: 'Ledger',
      icon: 'https://www.ledger.com/favicon.ico',
      provider: (window as any).ledger.solana
    });
  }

  // Generic window.solana (mobile in-app browsers - fallback)
  // Only add if no other wallet found, as this could be any wallet
  if (wallets.length === 0 && (window as any).solana?.isConnected !== undefined) {
    const solana = (window as any).solana;
    // Try to detect wallet name from the provider
    let name = 'Wallet';
    let icon = 'https://phantom.app/favicon.ico';

    if (solana.isPhantom) {
      name = 'Phantom';
    } else if (solana.isSolflare) {
      name = 'Solflare';
      icon = 'https://solflare.com/favicon.ico';
    }

    wallets.push({
      name,
      icon,
      provider: solana
    });
  }

  return wallets;
}

// Connect to a specific wallet
export async function connectWallet(wallet: WalletInfo): Promise<string | null> {
  try {
    let address: string | null = null;

    // Solflare returns boolean from connect(), then we get publicKey from the provider
    if (wallet.name === 'Solflare') {
      const isConnected = await wallet.provider.connect();
      if (isConnected && wallet.provider.publicKey) {
        address = wallet.provider.publicKey.toString();
      }
    } else {
      // For Phantom and other wallets
      let response;
      try {
        response = await wallet.provider.connect();
      } catch (connectErr: any) {
        throw connectErr;
      }
      address = response?.publicKey?.toString() || response?.pubkey?.toString();
    }

    if (address) {
      connectedWallet.set(address);
      walletName.set(wallet.name);
      return address;
    }
    console.error('No address returned from wallet');
    return null;
  } catch (e: any) {
    console.error(`Wallet connection failed for ${wallet.name}:`, e);
    // Return a more specific error message
    const errorMsg = e?.message || e?.toString() || `Failed to connect to ${wallet.name}`;
    throw new Error(errorMsg);
  }
}

// Disconnect wallet
export async function disconnectWallet(wallet?: WalletInfo): Promise<void> {
  try {
    if (wallet?.provider?.disconnect) {
      await wallet.provider.disconnect();
    }
    // Also disconnect from window if no specific wallet provided
    if (typeof window !== 'undefined') {
      const solana = (window as any).solana;
      if (solana?.disconnect) {
        try { await solana.disconnect(); } catch { }
      }
      const solflare = (window as any).solflare;
      if (solflare?.disconnect) {
        try { await solflare.disconnect(); } catch { }
      }
    }
    connectedWallet.set('');
    walletName.set('');
  } catch (e) {
    console.error('Disconnect failed:', e);
  }
}

// Sign a message with the wallet (for authentication)
export async function signMessage(wallet: WalletInfo, message: string): Promise<{ signature: string; message: string } | null> {
  try {
    const encodedMessage = new TextEncoder().encode(message);

    let signature: Uint8Array | null = null;

    // Try signMessage with standard approach first
    if (wallet.provider.signMessage) {
      try {
        const result = await wallet.provider.signMessage(encodedMessage, 'utf8');
        // Handle different return formats: Phantom returns { signature: Uint8Array }
        if (result && typeof result === 'object' && 'signature' in result) {
          signature = result.signature instanceof Uint8Array ? result.signature : new Uint8Array(result.signature as any);
        } else if (result instanceof Uint8Array) {
          signature = result;
        }
      } catch (e) {
        // Try with string message
        try {
          const result = await wallet.provider.signMessage(message, 'utf8');
          if (result && typeof result === 'object' && 'signature' in result) {
            signature = result.signature instanceof Uint8Array ? result.signature : new Uint8Array(result.signature as any);
          } else if (result instanceof Uint8Array) {
            signature = result;
          }
        } catch (e2) {
          // Try hex
          try {
            const result = await wallet.provider.signMessage(encodedMessage, 'hex');
            if (result && typeof result === 'object' && 'signature' in result) {
              signature = result.signature instanceof Uint8Array ? result.signature : new Uint8Array(result.signature as any);
            } else if (result instanceof Uint8Array) {
              signature = result;
            }
          } catch (e3) {
            // All failed
          }
        }
      }
    } else if (wallet.provider.sign) {
      // Legacy method
      const result = await wallet.provider.sign(encodedMessage);
      signature = result instanceof Uint8Array ? result : new Uint8Array(result);
    }

    if (signature && signature.length > 0) {
      // Convert to base64 safely
      const signatureArray = Array.from(signature);
      const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
      return { signature: signatureBase64, message };
    }

    return null;
  } catch (e) {
    console.error('Message signing failed:', e);
    return null;
  }
}
