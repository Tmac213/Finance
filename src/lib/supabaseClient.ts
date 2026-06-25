import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function createMockSupabase() {
  const tableApi = () => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: [], error: null }),
    update: async () => ({ data: [], error: null }),
    delete: async () => ({ error: null }),
    upsert: async () => ({ error: null }),
    eq: () => tableApi(),
    order: () => tableApi(),
    single: async () => ({ data: null, error: null }),
  });

  let mockUser = null;
  let mockSession = null;
  const callbacks = [];

  return {
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
      getSession: async () => ({ data: { session: mockSession } }),
      onAuthStateChange: (callback) => {
        callbacks.push(callback);
        // Initial call
        callback('INITIAL_SESSION', mockSession);
        return { data: { subscription: { unsubscribe() { callbacks.length = 0; } } } };
      },
      signInWithOAuth: async () => ({}),
      signInWithPassword: async (credentials) => {
        mockUser = { id: 'mock-id', email: credentials.email };
        mockSession = { access_token: 'mock-token', user: mockUser };
        // Trigger callbacks
        callbacks.forEach(cb => cb('SIGNED_IN', mockSession));
        return {
          data: {
            user: mockUser,
            session: mockSession
          },
          error: null
        };
      },
      signUp: async (credentials) => ({
        data: {
          user: { id: 'mock-signup-id', email: credentials.email },
          session: null // No auto-login for signup in mock
        },
        error: null
      }),
      signOut: async () => {
        mockUser = null;
        mockSession = null;
        // Trigger callbacks
        callbacks.forEach(cb => cb('SIGNED_OUT', null));
        return { error: null };
      },
    },
    from: () => tableApi(),
    channel: () => {
      const channel = {
        on: () => channel,
        subscribe: () => channel,
      };
      return channel;
    },
  } as any;
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMockSupabase();


