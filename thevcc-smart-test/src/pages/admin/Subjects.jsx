import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, EmptyState } from '../../components/States';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('subjects').select('*').order('name');
    setSubjects(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from('subjects').insert({ name: name.trim() });
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'That subject already exists.' : error.message);
      return;
    }
    setName('');
    toast.success('Subject added.');
    load();
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('subjects').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Could not delete — it may be used by an existing test.');
    } else {
      toast.success('Subject deleted.');
      load();
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-950">Subjects</h1>
      <p className="text-sm text-ink-500 mt-1">Manage the subject list used when creating tests.</p>

      <form onSubmit={handleAdd} className="flex gap-3 mt-6 max-w-md">
        <input className="input" placeholder="e.g. Mathematics" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary whitespace-nowrap">+ Add Subject</button>
      </form>

      <div className="card mt-6 max-w-md">
        {loading ? (
          <PageLoading />
        ) : subjects.length === 0 ? (
          <EmptyState icon="📚" title="No subjects yet" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-ink-800">{s.name}</span>
                <button className="text-brand-700 text-sm hover:underline" onClick={() => setDeleteTarget(s)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        message="Tests using this subject will keep their existing data, but this subject won't be selectable anymore."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
