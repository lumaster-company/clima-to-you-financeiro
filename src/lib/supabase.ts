
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysgxpivomlksbamtchec.supabase.co';
const supabaseAnonKey = 'sb_publishable_OFDnWMro20IPvQQ4LhaY7w_skCtCDuG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
