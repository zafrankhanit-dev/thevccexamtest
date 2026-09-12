// Run once, locally, to create VCC1..VCC100 student accounts:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seedStudents.mjs
//
// Accounts are created with status = false (OFF) so the admin can enable
// each one individually from User Access. Passwords are hashed by Supabase
// Auth itself — this script never touches a plaintext-password column.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COUNT = Number(process.env.STUDENT_COUNT || 100);
const DEFAULT_PASSWORD = process.env.STUDENT_PASSWORD || 'Vcc@1234';

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables first.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function createStudent(n) {
  const username = `VCC${n}`;
  const email = `${username.toLowerCase()}@students.thevcc.local`;

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { username, role: 'student' },
  });

  if (createErr) {
    console.warn(`Skipping ${username}: ${createErr.message}`);
    return;
  }

  const userId = created.user.id;

  await supabase.from('profiles').upsert({
    id: userId,
    role: 'student',
    username,
    full_name: `Student ${n}`,
  });

  await supabase.from('students').upsert({
    id: userId,
    student_id: username,
    status: false, // OFF by default — admin enables individually
  });

  console.log(`Created ${username}`);
}

async function main() {
  for (let n = 1; n <= COUNT; n++) {
    // eslint-disable-next-line no-await-in-loop
    await createStudent(n);
  }
  console.log(`Done. Default password for all students: ${DEFAULT_PASSWORD}`);
  console.log('All accounts are OFF — enable each from Admin -> User Access.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
