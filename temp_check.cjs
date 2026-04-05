import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking DB...");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name, role');
  console.log("Profiles (Service Key):", profiles, pErr);

  const { data: policies, error: polErr } = await supabase.rpc('get_policies'); // may not exist
  
  // Try querying orders
  const { data: orders, error: oErr } = await supabase.from('orders').select('*');
  console.log(`Orders count: ${orders?.length}`, oErr?.message);
}

run().catch(console.error);
