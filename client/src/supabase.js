import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If user accidentally includes /rest/v1/ in the URL, remove it for the client
const cleanUrl = supabaseUrl.endsWith('/rest/v1/') ? supabaseUrl.replace('/rest/v1/', '') : supabaseUrl;

export const supabase = createClient(cleanUrl, supabaseAnonKey);
