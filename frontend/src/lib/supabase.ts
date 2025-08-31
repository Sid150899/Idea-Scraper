import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

console.log('Supabase environment variables check:')
console.log('REACT_APP_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
console.log('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.error('supabaseUrl:', supabaseUrl)
  console.error('supabaseAnonKey:', supabaseAnonKey)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types based on your schema
export interface ScrapedIdea {
  idea_id: number
  title: string
  url: string
  content: string
  evaluation_score: number
  introduction: string
  implementation_plan: string
  market_analysis: string
  user_comments: string
  innovation: number
  quality: number
  problem_significance: number
  engagement_score: number
  reasoning_behind_score: string
  advise_for_improvement: string
  date_of_post: string
  source_subreddit: string
  created_at: string
  updated_at: string
}

export interface User {
  user_id: number
  first_name: string
  last_name: string
  email: string
  password_hash: string
  last_session_refresh: string
  is_paid: boolean
  created_at: string
  updated_at: string
}

export interface SavedIdea {
  user_id: number
  idea_id: number
}
