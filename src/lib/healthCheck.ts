export const healthCheck = {
  async checkAPI(): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async checkSupabase(): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async checkAll() {
    const [api, supabase] = await Promise.all([
      this.checkAPI(),
      this.checkSupabase(),
    ]);

    return {
      api,
      supabase,
      healthy: api && supabase,
      timestamp: new Date().toISOString(),
    };
  },
};
