// Run once, locally, to create the initial admin account:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seedAdmin.mjs
//
// This script uses the service_role key, which has full database access.
// NEVER put the service_role key in .env (the Vite-bundled file), in any
// VITE_* variable, or anywhere that ships to the browser. Run this from
// your own machine or a CI job, then discard the key from your shell history.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables first.');
  process.exit(1);
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'vccadmin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1947#';
const ADMIN_EMAIL = `${ADMIN_USERNAME}@admin.thevcc.local`;

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { username: ADMIN_USERNAME, role: 'admin' },
  });

  if (createErr) {
    console.error('Failed to create admin auth user:', createErr.message);
    process.exit(1);
  }

  const userId = created.user.id;

  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'admin',
    username: ADMIN_USERNAME,
    full_name: 'TheVCC Administrator',
  });
  if (profileErr) throw profileErr;

  const { error: adminErr } = await supabase.from('admins').upsert({ id: userId });
  if (adminErr) throw adminErr;

  console.log('Admin account created.');
  console.log('  Username:', ADMIN_USERNAME);
  console.log('  Password:', ADMIN_PASSWORD, '(change this immediately after first login)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
