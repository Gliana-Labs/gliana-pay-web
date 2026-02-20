import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { auth } from './auth';

describe('Auth Store', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('starts with null session', () => {
        expect(get(auth)).toBeNull();
    });

    it('check() returns null when no saved session', () => {
        const result = auth.check();
        expect(result).toBeNull();
        expect(get(auth)).toBeNull();
    });

    it('check() restores valid session from localStorage', () => {
        const session = { walletAddress: 'wallet123', name: 'Test', slug: 'test' };
        localStorage.setItem('gliana_session', JSON.stringify(session));

        const result = auth.check();
        expect(result).toEqual(session);
        expect(get(auth)).toEqual(session);
    });

    it('check() returns null for session missing walletAddress', () => {
        localStorage.setItem('gliana_session', JSON.stringify({ name: 'Test', slug: 'test' }));
        const result = auth.check();
        expect(result).toBeNull();
    });

    it('check() returns null for session missing slug', () => {
        localStorage.setItem('gliana_session', JSON.stringify({ walletAddress: 'w1', name: 'Test' }));
        const result = auth.check();
        expect(result).toBeNull();
    });

    it('check() handles corrupted JSON gracefully', () => {
        localStorage.setItem('gliana_session', 'not-valid-json');
        const result = auth.check();
        expect(result).toBeNull();
    });

    it('logout() clears session from store and localStorage', () => {
        const session = { walletAddress: 'wallet123', name: 'Test', slug: 'test' };
        localStorage.setItem('gliana_session', JSON.stringify(session));
        auth.check(); // load it

        auth.logout();
        expect(get(auth)).toBeNull();
        expect(localStorage.getItem('gliana_session')).toBeNull();
    });
});
