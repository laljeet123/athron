// Supabase shim: returns no-op client to avoid import-time crashes while
// frontend is migrated to backend REST APIs. Replace gradually with
// proper backend service calls and remove this shim when done.

function noopPromise(result = null) {
  return Promise.resolve({ data: result, error: null });
}

const supabase = {
  from: (/* table */) => {
    const chain = {
      select: () => noopPromise([]),
      insert: (payload) => noopPromise(Array.isArray(payload) ? payload : [payload]),
      upsert: (payload) => noopPromise(Array.isArray(payload) ? payload : [payload]),
      ilike: () => chain,
      eq: () => chain,
      gte: () => chain,
      order: () => chain,
      limit: () => noopPromise([]),
      single: () => noopPromise(null),
    };
    return chain;
  },
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => ({ data: null, error: null }),
    resetPasswordForEmail: async () => ({ data: null, error: null }),
  },
  storage: {
    from: (/* bucket */) => ({
      upload: async () => ({ error: null }),
      createSignedUrl: async (/* path, expires */) => ({ data: { signedUrl: "" }, error: null }),
    }),
  },
};

export { supabase };
