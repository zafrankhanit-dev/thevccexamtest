import { supabase } from './supabaseClient';

async function callAdminAction(payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: payload,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (error) throw new Error(error.message || 'Action failed.');
  if (data?.error) throw new Error(data.error);
  return data;
}

export function createStudent(payload) {
  return callAdminAction({ action: 'create_student', ...payload });
}

export function resetStudentPassword(id, new_password) {
  return callAdminAction({ action: 'reset_student_password', id, new_password });
}

export function deleteStudent(id) {
  return callAdminAction({ action: 'delete_student', id });
}

export function changeOwnUsername(new_username) {
  return callAdminAction({ action: 'change_own_username', new_username });
}

export function changeOwnPassword(current_password, new_password) {
  return callAdminAction({ action: 'change_own_password', current_password, new_password });
}
