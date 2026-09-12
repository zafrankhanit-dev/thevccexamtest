import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { PageLoading, Spinner } from '../../components/States';

const emptyForm = {
  name: '',
  subject_id: '',
  class: '',
  section: '',
  description: '',
  duration_minutes: 30,
  total_marks: 0,
  passing_percentage: 40,
  negative_marking: false,
  negative_marks: 0,
  start_date: '',
  end_date: '',
  is_active: false,
};

export default function TestForm() {
  const { testId } = useParams();
  const editing = !!testId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: subs } = await supabase.from('subjects').select('*').order('name');
      setSubjects(subs || []);

      if (editing) {
        const { data } = await supabase.from('tests').select('*').eq('id', testId).maybeSingle();
        if (data) {
          setForm({
            ...data,
            start_date: data.start_date ? data.start_date.slice(0, 16) : '',
            end_date: data.end_date ? data.end_date.slice(0, 16) : '',
          });
        }
        setLoading(false);
      }
    })();
  }, [testId, editing]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      subject_id: form.subject_id || null,
      class: form.class || null,
      section: form.section || null,
      description: form.description || null,
      duration_minutes: Number(form.duration_minutes),
      total_marks: Number(form.total_marks),
      passing_percentage: Number(form.passing_percentage),
      negative_marking: !!form.negative_marking,
      negative_marks: Number(form.negative_marks) || 0,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      is_active: !!form.is_active,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('tests').update(payload).eq('id', testId));
    } else {
      ({ error } = await supabase.from('tests').insert({ ...payload, created_by: user.id }));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? 'Test updated.' : 'Test created — now add questions.');
    navigate('/admin/tests');
  };

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-ink-950">{editing ? 'Edit Test' : 'Create Test'}</h1>

      <form onSubmit={handleSubmit} className="card p-6 mt-6 space-y-4">
        <div>
          <label className="label">Test Name</label>
          <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Subject</label>
            <select className="input" value={form.subject_id || ''} onChange={(e) => set('subject_id', e.target.value)}>
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div />
          <div>
            <label className="label">Class</label>
            <input className="input" value={form.class || ''} onChange={(e) => set('class', e.target.value)} placeholder="e.g. IX" />
          </div>
          <div>
            <label className="label">Section</label>
            <input className="input" value={form.section || ''} onChange={(e) => set('section', e.target.value)} placeholder="e.g. A" />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" min="1" className="input" required value={form.duration_minutes} onChange={(e) => set('duration_minutes', e.target.value)} />
          </div>
          <div>
            <label className="label">Total Marks</label>
            <input type="number" min="0" className="input" required value={form.total_marks} onChange={(e) => set('total_marks', e.target.value)} />
          </div>
          <div>
            <label className="label">Passing %</label>
            <input type="number" min="0" max="100" className="input" required value={form.passing_percentage} onChange={(e) => set('passing_percentage', e.target.value)} />
          </div>
        </div>

        <div className="rounded-lg border border-ink-200 p-4">
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
            <input type="checkbox" checked={form.negative_marking} onChange={(e) => set('negative_marking', e.target.checked)} />
            Negative Marking
          </label>
          {form.negative_marking && (
            <div className="mt-3 max-w-[200px]">
              <label className="label">Marks deducted per wrong answer</label>
              <input type="number" min="0" step="0.05" className="input" value={form.negative_marks} onChange={(e) => set('negative_marks', e.target.value)} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date/Time (optional)</label>
            <input type="datetime-local" className="input" value={form.start_date || ''} onChange={(e) => set('start_date', e.target.value)} />
          </div>
          <div>
            <label className="label">End Date/Time (optional)</label>
            <input type="datetime-local" className="input" value={form.end_date || ''} onChange={(e) => set('end_date', e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          Active (visible to eligible students immediately)
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/tests')}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner /> : 'Save Test'}</button>
        </div>
      </form>
    </div>
  );
}
