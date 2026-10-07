import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://eadilmpxzwhtushksgtw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_iRaCFFAdu_vopIgejFqByQ_r5VNWe-o'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase.from('availability_slots').select('*').limit(5)
  console.log("Slots:", data)
  if (error) console.error("Error:", error)
}
test()
