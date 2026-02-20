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
      icon: 'https://www.svgrepo.com/show/374171/phantom.svg',
      provider: (window as any).phantom.solana
    });
  }

  // Solflare - use solflare.solana for the provider
  if ((window as any).solflare?.solana?.isSolflare || (window as any).solflare?.isSolflare) {
    wallets.push({
      name: 'Solflare',
      icon: 'https://www.svgrepo.com/show/475647/solflare.svg',
      provider: (window as any).solflare.solana || (window as any).solflare
    });
  }

  // Backpack
  if ((window as any).backpack?.solana?.isBackpack) {
    wallets.push({
      name: 'Backpack',
      icon: 'https://www.svgrepo.com/show/528352/backpack.svg',
      provider: (window as any).backpack.solana
    });
  }

  // Ledger
  if ((window as any).ledger?.solana) {
    wallets.push({
      name: 'Ledger',
      icon: 'https://www.svgrepo.com/show/374121/ledger.svg',
      provider: (window as any).ledger.solana
    });
  }

  // Generic window.solana (mobile in-app browsers - fallback)
  // Only add if no other wallet found, as this could be any wallet
  if (wallets.length === 0 && (window as any).solana?.isConnected !== undefined) {
    const solana = (window as any).solana;
    // Try to detect wallet name from the provider
    let name = 'Wallet';
    let icon = 'https://www.svgrepo.com/show/374171/phantom.svg';

    if (solana.isPhantom) {
      name = 'Phantom';
    } else if (solana.isSolflare) {
      name = 'Solflare';
      icon = 'https://www.svgrepo.com/show/475647/solflare.svg';
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
    console.log(`Connecting to ${wallet.name}...`);
    console.log('Provider:', wallet.provider);

    let address: string | null = null;

    // Solflare returns boolean from connect(), then we get publicKey from the provider
    if (wallet.name === 'Solflare') {
      const isConnected = await wallet.provider.connect();
      console.log('Solflare isConnected:', isConnected);
      if (isConnected && wallet.provider.publicKey) {
        address = wallet.provider.publicKey.toString();
      }
    } else {
      // For Phantom and other wallets
      let response;
      try {
        response = await wallet.provider.connect();
      } catch (connectErr: any) {
        // If regular connect fails, try with network parameter for Phantom
        if (wallet.name === 'Phantom') {
          console.log('Trying Phantom with network param...');
          response = await wallet.provider.connect({ network: 'devnet' });
        } else {
          throw connectErr;
        }
      }
      address = response?.publicKey?.toString() || response?.pubkey?.toString();
    }

    if (address) {
      connectedWallet.set(address);
      walletName.set(wallet.name);
      console.log(`Connected to ${wallet.name}: ${address}`);
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
        try { await solana.disconnect(); } catch {}
      }
      const solflare = (window as any).solflare;
      if (solflare?.disconnect) {
        try { await solflare.disconnect(); } catch {}
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

    // Try different sign methods
    if (wallet.provider.signMessage) {
      // Try different display formats and message formats for different wallets
      const displayOptions = ['utf8', 'hex'];
      const messageOptions = [encodedMessage, message];

      for (const display of displayOptions) {
        for (const msg of messageOptions) {
          try {
            const result = await wallet.provider.signMessage(msg, display);
            // Handle different return formats: Phantom returns { signature: Uint8Array }
            if (result && typeof result === 'object' && 'signature' in result) {
              const sig = result.signature;
              signature = sig instanceof Uint8Array ? sig : new Uint8Array(sig as any);
            } else if (result instanceof Uint8Array) {
              signature = result;
            }
            if (signature) break;
          } catch (e) {
            // Try next option
          }
        }
        if (signature) break;
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
