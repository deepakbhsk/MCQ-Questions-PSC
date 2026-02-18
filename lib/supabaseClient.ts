
import { createClient } from '@supabase/supabase-js';
import { Question } from '../types';

// Supabase project credentials.
// Use VITE_ prefix for Vite environmental variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// The types provide safety for database operations.
export interface Database {
  public: {
    Tables: {
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Question, 'id' | 'created_at'>> & { id?: string; created_at?: string };
      };
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
