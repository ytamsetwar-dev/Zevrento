import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://eadilmpxzwhtushksgtw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_iRaCFFAdu_vopIgejFqByQ_r5VNWe-o'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  const slot = {
      id: `s_${Date.now()}`,
      is_booked: false,
      created_at: new Date().toISOString(),
      vehicle_id: `vh_${Date.now()}`,
      model: "Ola S1 Pro",
      plate: "MH12AB1234",
      battery: 90,
      host_phone: "1234567890",
      pickup_location: "Begumpet - Main Road",
      hub_id: "begumpet",
      start_time: "2026-10-08T12:00",
      end_time: "2026-10-08T18:00",
  }
  const { data, error } = await supabase.from('availability_slots').insert([slot])
  if (error) console.error("Insert Error:", error)
  else console.log("Insert Success:", data)
}
test()
