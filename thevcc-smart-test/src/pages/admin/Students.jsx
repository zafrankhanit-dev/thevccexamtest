import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { createStudent, resetStudentPassword } from '../../lib/adminActions';
import { PageLoading, EmptyState, Spinner } from '../../components/States';
import ConfirmDialog from '../../components/ConfirmDialog';

const emptyForm = { student_id: '', full_name: '', class: '', section: '', phone: '', email: '', password: 'Vcc@1234' };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPw, setResetPw] = useState('Vcc@1234');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('id, student_id, class, section, phone, email, status, created_at, last_login, profiles(full_name)')
      .order('student_id');
    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return students;
    const q = query.toLowerCase();
    return students.filter(
      (s) =>
        s.student_id.toLowerCase().includes(q) ||
        (s.profiles?.full_name || '').toLowerCase().includes(q)
    );
  }, [students, query]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      student_id: s.student_id,
      full_name: s.profiles?.full_name || '',
      class: s.class || '',
      section: s.section || '',
      phone: s.phone || '',
      email: s.email || '',
      password: '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', editing.id);
        await supabase
          .from('students')
          .update({ class: form.class, section: form.section, phone: form.phone, email: form.email })
          .eq('id', editing.id);
        toast.success('Student updated.');
      } else {
        await createStudent(form);
        toast.success('Student created.');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not save student.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetStudentPassword(resetTarget.id, resetPw);
      toast.success(`Password reset for ${resetTarget.student_id}.`);
      setResetTarget(null);
      setResetPw('Vcc@1234');
    } catch (err) {
      toast.error(err.message || 'Could not reset password.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink-950">Students</h1>
          <p className="text-sm text-ink-500 mt-1">Manage student records.</p>
        </div>
        <div className="flex gap-3">
          <input className="input max-w-xs" placeholder="Search name, username, ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn-primary whitespace-nowrap" onClick={openAdd}>+ Add Student</button>
        </div>
      </div>

      <div className="card mt-6">
        {loading ? (
          <PageLoading />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🎓" title="No students found" />
        ) : (
          <div className="table-wrap border-0 rounded-none">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.student_id}</td>
                    <td>{s.profiles?.full_name}</td>
                    <td>{s.class || '—'}</td>
                    <td>{s.section || '—'}</td>
                    <td><span className={s.status ? 'badge-green' : 'badge-red'}>{s.status ? 'ON' : 'OFF'}</span></td>
                    <td>{s.last_login ? new Date(s.last_login).toLocaleString() : 'Never'}</td>
                    <td className="space-x-2 whitespace-nowrap">
                      <button className="text-brand-700 text-sm font-medium hover:underline" onClick={() => openEdit(s)}>Edit</button>
                      <button className="text-ink-500 text-sm font-medium hover:underline" onClick={() => setResetTarget(s)}>Reset Password</button>
                      <Link to={`/admin/students/${s.id}`} className="text-ink-500 text-sm font-medium hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setShowForm(false)} />
          <form onSubmit={handleSubmit} className="relative card w-full max-w-md p-6 shadow-popover max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit Student' : 'Add Student'}</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Username / Student ID</label>
                <input className="input" required disabled={!!editing} value={form.student_id}
                  onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))} placeholder="VCC101" />
              </div>
              <div>
                <label className="label">Student Name</label>
                <input className="input" required value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Class</label>
                  <input className="input" value={form.class} onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Section</label>
                  <input className="input" value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email (optional)</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              {!editing && (
                <div>
                  <label className="label">Initial Password</label>
                  <input className="input" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner /> : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!resetTarget}
        title={`Reset password for ${resetTarget?.student_id || ''}`}
        message={
          <div className="space-y-3 text-left">
            <p>Set a new password for this student.</p>
            <input className="input" value={resetPw} onChange={(e) => setResetPw(e.target.value)} />
          </div>
        }
        confirmLabel="Reset Password"
        onCancel={() => setResetTarget(null)}
        onConfirm={handleReset}
      />
    </div>
  );
}
