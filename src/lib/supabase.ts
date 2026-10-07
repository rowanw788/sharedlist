import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase env vars: ` +
      `VITE_SUPABASE_URL=${supabaseUrl ? 'set' : 'MISSING'}, ` +
      `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey ? 'set' : 'MISSING'}. ` +
      `Ensure these are configured in your hosting platform (e.g. Vercel) environment variables.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export const SHARED_PASSWORD = import.meta.env.VITE_SHARED_PASSWORD as string;

export interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
  updated_by: string;
}
