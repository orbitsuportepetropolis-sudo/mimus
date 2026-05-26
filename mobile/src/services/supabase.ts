import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lmuyarubwmdoaadxbgpl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdXlhcnVid21kb2FhZHhiZ3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTMwOTMsImV4cCI6MjA5NTA2OTA5M30.sGRkAdQupp5uh-LKFd3wj2vI5xnQWLcUdSg3kxkbl20'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
