import { writable } from 'svelte/store';

interface Session {
  walletAddress: string;
  name: string;
  slug: string;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<Session | null>(null);

  return {
    subscribe,
    check: () => {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem('gliana_session');
      if (saved) {
        try {
          const session = JSON.parse(saved);
          if (session.walletAddress && session.slug) {
            set(session);
            return session;
          }
        } catch (e) {
          console.error('Failed to parse session:', e);
        }
      }
      return null;
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gliana_session');
      }
      set(null);
    }
  };
}

export const auth = createAuthStore();
