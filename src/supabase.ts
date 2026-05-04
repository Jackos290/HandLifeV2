import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zrkixsxexoyicmunzodx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya2l4c3hleG95aWNtdW56b2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTQzOTMsImV4cCI6MjA5MTE5MDM5M30.weH8K_fNgeO9SdrPsDS8pUT28gNms-y2M1Z_YPLmDJY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});