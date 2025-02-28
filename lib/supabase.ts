import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// During development, show a more helpful message if Supabase isn't connected
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '\x1b[33m⚠️ Supabase credentials missing. Please click "Connect to Supabase" in the top right corner to set up your project.\x1b[0m'
    );
  }
}

// Provide fallback values during development to prevent crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);