import { supabase } from './supabaseClient';

/**
 * Uploads a student's photo to the public "avatars" bucket and returns the
 * public URL. Only an admin session can succeed (enforced by storage RLS).
 */
export async function uploadStudentPhoto(studentId, file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${studentId}.${ext}`;

  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust so a re-uploaded photo shows immediately instead of the old cached one.
  return `${data.publicUrl}?t=${Date.now()}`;
}
