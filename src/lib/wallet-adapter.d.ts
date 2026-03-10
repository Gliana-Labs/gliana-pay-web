// Type declarations for packages without types
declare module '@aztemi/svelte-on-solana-wallet-adapter-core' {
  import type { Writable } from 'svelte/store';
  import type { PublicKey, Transaction, Connection } from '@solana/web3.js';
  import type { SendTransactionOptions, WalletName } from '@solana/wallet-adapter-base';

  interface WalletStore {
    wallet: any;
    publicKey: PublicKey | null;
    connected: boolean;
    connecting: boolean;
    disconnecting: boolean;
    select(walletName: WalletName): void;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(transaction: Transaction, connection: Connection, options?: SendTransactionOptions): Promise<string>;
    signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined;
    signAllTransactions: ((transactions: Transaction[]) => Promise<Transaction[]>) | undefined;
    signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined;
  }

  export const walletStore: Writable<WalletStore>;
}

declare module '@aztemi/svelte-on-solana-wallet-adapter-ui' {
  import type { SvelteComponent } from 'svelte';

  export class WalletProvider extends SvelteComponent<{
    localStorageKey?: string;
    wallets?: any[];
    autoConnect?: boolean;
  }> {}

  export class ConnectionProvider extends SvelteComponent<{
    endpoint: string;
  }> {}

  export class WalletMultiButton extends SvelteComponent<{
    maxNumberOfWallets?: number;
  }> {}
}
