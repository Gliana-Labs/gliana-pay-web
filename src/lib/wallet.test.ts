import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
    getAvailableWallets,
    connectWallet,
    disconnectWallet,
    signMessage,
    connectedWallet,
    walletName
} from './wallet';

// Mock TextEncoder for jsdom environment if missing
if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = class TextEncoder {
        encode(text: string) {
            const arr = new Uint8Array(text.length);
            for (let i = 0; i < text.length; i++) {
                arr[i] = text.charCodeAt(i);
            }
            return arr;
        }
    } as any;
}

describe('Wallet Authentication Logic', () => {
    beforeEach(() => {
        // Reset stores
        connectedWallet.set('');
        walletName.set('');

        // Clear mocked window properties
        delete (window as any).phantom;
        delete (window as any).solflare;
        delete (window as any).ledger;
        delete (window as any).solana;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should detect Phantom wallet', () => {
        (window as any).phantom = { solana: { isPhantom: true } };
        const wallets = getAvailableWallets();
        expect(wallets).toHaveLength(1);
        expect(wallets[0].name).toBe('Phantom');
    });

    it('should detect Solflare wallet', () => {
        (window as any).solflare = { isSolflare: true };
        const wallets = getAvailableWallets();
        expect(wallets).toHaveLength(1);
        expect(wallets[0].name).toBe('Solflare');
    });

    it('should successfully connect to Phantom and set stores', async () => {
        const mockProvider = {
            connect: vi.fn().mockResolvedValue({ publicKey: { toString: () => 'PhantomAddress123' } })
        };

        const address = await connectWallet({
            name: 'Phantom',
            icon: '',
            provider: mockProvider
        });

        expect(address).toBe('PhantomAddress123');
        expect(get(connectedWallet)).toBe('PhantomAddress123');
        expect(get(walletName)).toBe('Phantom');
        expect(mockProvider.connect).toHaveBeenCalled();
    });

    it('should fall back to devnet connection if default fails for Phantom', async () => {
        const mockProvider = {
            connect: vi.fn()
                .mockRejectedValueOnce(new Error('Connection rejected')) // default fails
                .mockResolvedValueOnce({ publicKey: { toString: () => 'PhantomDevnet123' } }) // fallback succeeds
        };

        const address = await connectWallet({
            name: 'Phantom',
            icon: '',
            provider: mockProvider
        });

        expect(address).toBe('PhantomDevnet123');
        expect(mockProvider.connect).toHaveBeenCalledTimes(2);
        expect(mockProvider.connect).toHaveBeenNthCalledWith(2, { network: 'devnet' });
    });

    it('should successfully connect to Solflare (returns true) and set stores', async () => {
        const mockProvider = {
            connect: vi.fn().mockResolvedValue(true),
            publicKey: { toString: () => 'SolflareAddress456' }
        };

        const address = await connectWallet({
            name: 'Solflare',
            icon: '',
            provider: mockProvider
        });

        expect(address).toBe('SolflareAddress456');
        expect(get(connectedWallet)).toBe('SolflareAddress456');
        expect(get(walletName)).toBe('Solflare');
        expect(mockProvider.connect).toHaveBeenCalled();
    });

    it('should clear stores and call disconnect on provider', async () => {
        connectedWallet.set('ExistingWallet123');
        walletName.set('Phantom');

        const mockProvider = {
            disconnect: vi.fn().mockResolvedValue(undefined)
        };

        await disconnectWallet({
            name: 'Phantom',
            icon: '',
            provider: mockProvider
        });

        expect(get(connectedWallet)).toBe('');
        expect(get(walletName)).toBe('');
        expect(mockProvider.disconnect).toHaveBeenCalled();
    });

    it('should correctly sign a message and return base64 encoded signature', async () => {
        const mockSignature = new Uint8Array([1, 2, 3, 4, 5]); // Dummy signature bytes
        const mockProvider = {
            signMessage: vi.fn().mockResolvedValue({ signature: mockSignature })
        };

        const result = await signMessage({ name: 'Phantom', icon: '', provider: mockProvider }, 'Test auth message');

        expect(result).not.toBeNull();
        expect(mockProvider.signMessage).toHaveBeenCalled();
        // Validate that signature gets converted to base64
        expect(result?.signature).toBe(btoa(String.fromCharCode(...[1, 2, 3, 4, 5])));
        expect(result?.message).toBe('Test auth message');
    });

    it('should handle wallet connection errors gracefully', async () => {
        const mockProvider = {
            connect: vi.fn().mockRejectedValue(new Error('User rejected connection'))
        };

        await expect(connectWallet({
            name: 'Ledger',
            icon: '',
            provider: mockProvider
        })).rejects.toThrow('User rejected connection');
    });
});
