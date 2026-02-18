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

  // Phantom
  if ((window as any).phantom?.solana?.isPhantom) {
    wallets.push({
      name: 'Phantom',
      icon: 'https://www.svgrepo.com/show/374171/phantom.svg',
      provider: (window as any).phantom.solana
    });
  }

  // Solflare
  if ((window as any).solflare?.isSolflare) {
    wallets.push({
      name: 'Solflare',
      icon: 'https://www.svgrepo.com/show/475647/solflare.svg',
      provider: (window as any).solflare
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

  // Slope
  if ((window as any).slope?.wallet) {
    wallets.push({
      name: 'Slope',
      icon: 'https://www.svgrepo.com/show/375577/slope.svg',
      provider: (window as any).slope
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

  return wallets;
}

// Connect to a specific wallet
export async function connectWallet(wallet: WalletInfo): Promise<string | null> {
  try {
    const response = await wallet.provider.connect();
    const address = response.publicKey?.toString() || response.pubkey?.toString();
    if (address) {
      connectedWallet.set(address);
      walletName.set(wallet.name);
      return address;
    }
    return null;
  } catch (e: any) {
    console.error('Wallet connection failed:', e);
    return null;
  }
}

// Disconnect wallet
export async function disconnectWallet(wallet: WalletInfo): Promise<void> {
  try {
    if (wallet.provider.disconnect) {
      await wallet.provider.disconnect();
    }
    connectedWallet.set('');
    walletName.set('');
  } catch (e) {
    console.error('Disconnect failed:', e);
  }
}
