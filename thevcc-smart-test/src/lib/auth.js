import { supabase } from './supabaseClient';

export const STUDENT_EMAIL_DOMAIN = 'students.thevcc.local';
export const ADMIN_EMAIL_DOMAIN = 'admin.thevcc.local';

export function usernameToStudentEmail(username) {
  return `${username.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}

export function usernameToAdminEmail(username) {
  return `${username.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;
}

/**
 * Student login. Verifies credentials with Supabase Auth, then checks the
 * students.status flag. Disabled accounts are signed back out immediately —
 * the lock is never just a UI decision, and the same status is re-checked by
 * RLS/RPC functions on every subsequent call for defense in depth.
 */
export async function studentSignIn(username, password) {
  const email = usernameToStudentEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error('Incorrect username or password.');
  }

  const userId = data.user.id;
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id, status, student_id')
    .eq('id', userId)
    .maybeSingle();

  if (studentErr || !student) {
    await supabase.auth.signOut();
    throw new Error('This account is not set up as a student. Contact the administrator.');
  }

  if (student.status !== true) {
    await supabase.auth.signOut();
    const err = new Error('ACCOUNT_LOCKED');
    err.code = 'ACCOUNT_LOCKED';
    throw err;
  }

  await supabase.from('students').update({ last_login: new Date().toISOString() }).eq('id', userId);

  return data.user;
}

export async function adminSignIn(username, password) {
  const email = usernameToAdminEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error('Incorrect username or password.');
  }

  const { data: admin, error: adminErr } = await supabase
    .from('admins')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (adminErr || !admin) {
    await supabase.auth.signOut();
    throw new Error('This account is not an admin account.');
  }

  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}
