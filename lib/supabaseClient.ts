
import { createClient } from '@supabase/supabase-js';
import { Question } from '../types';

// Supabase project credentials provided by the user.
const supabaseUrl = 'https://lqibglpbquybvsrywyhm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxaWJnbHBicXV5YnZzcnl3eWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTg1MTAsImV4cCI6MjA3ODc5NDUxMH0.te4Uq6RnUKq38AtlSVLBIR4vDC4GYGJQPRpKMJ0e_9I';

// The types provide safety for database operations.
// `Row` matches the table structure.
// `Insert` is for new records (DB handles `id`, `created_at`).
// `Update` is for changing existing records.
export const supabase = createClient<{
  public: {
    Tables: {
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'created_at'>;
        Update: Partial<Omit<Question, 'id' | 'created_at'>>;
      };
    };
  };
}>(supabaseUrl, supabaseAnonKey);
