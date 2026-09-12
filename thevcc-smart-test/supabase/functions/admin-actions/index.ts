// Supabase Edge Function: admin-actions
//
// This is the ONLY place in the whole system that touches the service_role
// key. It runs on Supabase's servers, never in the browser. Deploy with:
//   supabase functions deploy admin-actions
// and set its secrets with:
//   supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
//
// Every request must include the caller's own Supabase session JWT
// (Authorization: Bearer <access_token>) — this function re-verifies that
// the caller is an authenticated admin (via the `admins` table) before
// doing anything privileged. Without a valid admin JWT, every action fails.

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY'); // public key, safe as a function secret too

const STUDENT_DOMAIN = 'students.thevcc.local';
const ADMIN_DOMAIN = 'admin.thevcc.local';

function cors(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors({});

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const callerToken = authHeader.replace('Bearer ', '');
    if (!callerToken) return cors({ error: 'Missing authorization.' }, 401);

    // Client scoped to the caller's own JWT — used only to verify identity.
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser(callerToken);
    if (userErr || !userData?.user) return cors({ error: 'Invalid session.' }, 401);

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: adminRow } = await adminClient
      .from('admins')
      .select('id')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (!adminRow) return cors({ error: 'Only admins can perform this action.' }, 403);

    const body = await req.json();
    const { action } = body;

    if (action === 'create_student') {
      const { student_id, full_name, class: klass, section, phone, email, password } = body;
      if (!student_id || !full_name || !password) {
        return cors({ error: 'student_id, full_name and password are required.' }, 400);
      }
      const authEmail = `${student_id.toLowerCase()}@${STUDENT_DOMAIN}`;
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
        user_metadata: { username: student_id, role: 'student' },
      });
      if (createErr) return cors({ error: createErr.message }, 400);

      const userId = created.user.id;
      await adminClient.from('profiles').insert({ id: userId, role: 'student', username: student_id, full_name });
      await adminClient.from('students').insert({
        id: userId,
        student_id,
        class: klass || null,
        section: section || null,
        phone: phone || null,
        email: email || null,
        status: false,
      });
      return cors({ ok: true, id: userId });
    }

    if (action === 'reset_student_password') {
      const { id, new_password } = body;
      if (!id || !new_password) return cors({ error: 'id and new_password are required.' }, 400);
      const { error: pwErr } = await adminClient.auth.admin.updateUserById(id, { password: new_password });
      if (pwErr) return cors({ error: pwErr.message }, 400);
      return cors({ ok: true });
    }

    if (action === 'delete_student') {
      const { id } = body;
      if (!id) return cors({ error: 'id is required.' }, 400);
      const { error: delErr } = await adminClient.auth.admin.deleteUser(id);
      if (delErr) return cors({ error: delErr.message }, 400);
      return cors({ ok: true });
    }

    if (action === 'change_own_username') {
      const { new_username } = body;
      if (!new_username || !/^[a-zA-Z0-9_.-]{3,32}$/.test(new_username)) {
        return cors({ error: 'Enter a valid username (3-32 characters).' }, 400);
      }
      const newEmail = `${new_username.toLowerCase()}@${ADMIN_DOMAIN}`;
      const { error: updErr } = await adminClient.auth.admin.updateUserById(userData.user.id, { email: newEmail, email_confirm: true });
      if (updErr) return cors({ error: updErr.message }, 400);
      await adminClient.from('profiles').update({ username: new_username }).eq('id', userData.user.id);
      return cors({ ok: true, username: new_username });
    }

    if (action === 'change_own_password') {
      const { current_password, new_password } = body;
      if (!current_password || !new_password) return cors({ error: 'current_password and new_password are required.' }, 400);
      if (new_password.length < 8) return cors({ error: 'New password must be at least 8 characters.' }, 400);

      // Re-verify the current password before allowing the change.
      const anonClient = createClient(SUPABASE_URL, ANON_KEY);
      const { data: profile } = await adminClient.from('profiles').select('username').eq('id', userData.user.id).maybeSingle();
      const currentEmail = `${profile.username.toLowerCase()}@${ADMIN_DOMAIN}`;
      const { error: verifyErr } = await anonClient.auth.signInWithPassword({ email: currentEmail, password: current_password });
      if (verifyErr) return cors({ error: 'Current password is incorrect.' }, 401);

      const { error: updErr } = await adminClient.auth.admin.updateUserById(userData.user.id, { password: new_password });
      if (updErr) return cors({ error: updErr.message }, 400);
      return cors({ ok: true });
    }

    return cors({ error: 'Unknown action.' }, 400);
  } catch (err) {
    return cors({ error: err.message || 'Unexpected error.' }, 500);
  }
});
