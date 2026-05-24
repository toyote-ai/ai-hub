import { createClient } from '@supabase/supabase-js'

// 先ほど .env.local に書いたURLと鍵を読み込みます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabaseと通信するための専用パイプ（クライアント）を作成して書き出します
export const supabase = createClient(supabaseUrl, supabaseKey)