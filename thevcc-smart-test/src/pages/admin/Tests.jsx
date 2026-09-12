import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, EmptyState } from '../../components/States';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function Tests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tests')
      .select('*, subjects(name), questions(count)')
      .order('created_at', { ascending: false });
    setTests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (t) => {
    const { error } = await supabase.from('tests').update({ is_active: !t.is_active }).eq('id', t.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${t.name} is now ${!t.is_active ? 'active' : 'inactive'}.`);
    load();
  };

  const duplicate = async (t) => {
    const { data: newTest, error } = await supabase
      .from('tests')
      .insert({
        name: `${t.name} (Copy)`,
        subject_id: t.subject_id,
        class: t.class,
        section: t.section,
        description: t.description,
        duration_minutes: t.duration_minutes,
        total_marks: t.total_marks,
        passing_percentage: t.passing_percentage,
        negative_marking: t.negative_marking,
        negative_marks: t.negative_marks,
        is_active: false,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }

    const { data: questions } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('test_id', t.id)
      .order('order_index');

    for (const q of questions || []) {
      const { data: newQ } = await supabase
        .from('questions')
        .insert({ test_id: newTest.id, question_text: q.question_text, marks: q.marks, explanation: q.explanation, order_index: q.order_index })
        .select()
        .single();
      if (newQ) {
        await supabase.from('question_options').insert(
          q.question_options.map((o) => ({ question_id: newQ.id, option_label: o.option_label, option_text: o.option_text, is_correct: o.is_correct }))
        );
      }
    }

    toast.success('Test duplicated.');
    load();
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('tests').delete().eq('id', deleteTarget.id);
    if (error) toast.error(error.message);
    else toast.success('Test deleted.');
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink-950">Tests</h1>
          <p className="text-sm text-ink-500 mt-1">Create and manage MCQ tests.</p>
        </div>
        <Link to="/admin/tests/new" className="btn-primary">+ Create Test</Link>
      </div>

      <div className="card mt-6">
        {loading ? (
          <PageLoading />
        ) : tests.length === 0 ? (
          <EmptyState icon="📝" title="No tests yet" description="Create your first test to get started." />
        ) : (
          <div className="table-wrap border-0 rounded-none">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Questions</th>
                  <th>Marks</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.name}</td>
                    <td>{t.subjects?.name || '—'}</td>
                    <td>{t.questions?.[0]?.count ?? 0}</td>
                    <td>{t.total_marks}</td>
                    <td>{t.duration_minutes}m</td>
                    <td>
                      <button onClick={() => toggleActive(t)} className={t.is_active ? 'badge-green' : 'badge-gray'}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="space-x-2 whitespace-nowrap text-sm">
                      <Link to={`/admin/tests/${t.id}/questions`} className="text-brand-700 font-medium hover:underline">Questions</Link>
                      <Link to={`/admin/tests/${t.id}/assign`} className="text-ink-600 font-medium hover:underline">Assign</Link>
                      <Link to={`/admin/tests/${t.id}/edit`} className="text-ink-600 font-medium hover:underline">Edit</Link>
                      <button className="text-ink-600 font-medium hover:underline" onClick={() => duplicate(t)}>Duplicate</button>
                      <button className="text-brand-700 font-medium hover:underline" onClick={() => setDeleteTarget(t)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This will permanently delete the test, its questions, and all student attempts. This cannot be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
