import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, Spinner, EmptyState } from '../../components/States';

export default function AssignTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [mode, setMode] = useState('all');
  const [klass, setKlass] = useState('');
  const [section, setSection] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: a }, { data: s }] = await Promise.all([
      supabase.from('tests').select('*').eq('id', testId).maybeSingle(),
      supabase.from('test_assignments').select('*, students(student_id, profiles(full_name))').eq('test_id', testId),
      supabase.from('students').select('id, student_id, class, section, profiles(full_name)').order('student_id'),
    ]);
    setTest(t);
    setAssignments(a || []);
    setStudents(s || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [testId]);

  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === 'all') {
        await supabase.from('test_assignments').insert({ test_id: testId, assignment_type: 'all' });
      } else if (mode === 'class') {
        if (!klass) throw new Error('Enter a class.');
        await supabase.from('test_assignments').insert({ test_id: testId, assignment_type: 'class', class: klass });
      } else if (mode === 'section') {
        if (!klass || !section) throw new Error('Enter class and section.');
        await supabase.from('test_assignments').insert({ test_id: testId, assignment_type: 'section', class: klass, section });
      } else if (mode === 'selected') {
        if (selectedStudents.size === 0) throw new Error('Select at least one student.');
        await supabase.from('test_assignments').insert(
          Array.from(selectedStudents).map((id) => ({ test_id: testId, assignment_type: 'selected', student_id: id }))
        );
      }
      toast.success('Assignment saved.');
      setSelectedStudents(new Set());
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (id) => {
    await supabase.from('test_assignments').delete().eq('id', id);
    load();
  };

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/tests" className="text-sm text-ink-500 hover:text-brand-700">← Back to Tests</Link>
      <h1 className="text-xl font-bold text-ink-950 mt-2">Assign: {test?.name}</h1>

      <form onSubmit={handleAssign} className="card p-6 mt-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          {[
            ['all', 'All Students'],
            ['class', 'Specific Class'],
            ['section', 'Specific Section'],
            ['selected', 'Selected Students'],
          ].map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 text-sm font-medium">
              <input type="radio" name="mode" checked={mode === val} onChange={() => setMode(val)} />
              {label}
            </label>
          ))}
        </div>

        {(mode === 'class' || mode === 'section') && (
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <label className="label">Class</label>
              <input className="input" value={klass} onChange={(e) => setKlass(e.target.value)} placeholder="e.g. IX" />
            </div>
            {mode === 'section' && (
              <div>
                <label className="label">Section</label>
                <input className="input" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" />
              </div>
            )}
          </div>
        )}

        {mode === 'selected' && (
          <div className="max-h-64 overflow-y-auto border border-ink-200 rounded-lg divide-y divide-ink-100">
            {students.map((s) => (
              <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-ink-50">
                <input
                  type="checkbox"
                  checked={selectedStudents.has(s.id)}
                  onChange={() => {
                    setSelectedStudents((prev) => {
                      const next = new Set(prev);
                      next.has(s.id) ? next.delete(s.id) : next.add(s.id);
                      return next;
                    });
                  }}
                />
                <span className="font-medium">{s.student_id}</span>
                <span className="text-ink-400">{s.profiles?.full_name}</span>
              </label>
            ))}
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner /> : 'Save Assignment'}</button>
      </form>

      <div className="card mt-6">
        <div className="px-5 py-4 border-b border-ink-100 font-semibold text-ink-900">Current Assignments</div>
        {assignments.length === 0 ? (
          <EmptyState icon="🎯" title="Not assigned to anyone yet" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>
                  {a.assignment_type === 'all' && 'All students'}
                  {a.assignment_type === 'class' && `Class ${a.class}`}
                  {a.assignment_type === 'section' && `Class ${a.class} · Section ${a.section}`}
                  {a.assignment_type === 'selected' && `${a.students?.student_id} — ${a.students?.profiles?.full_name}`}
                </span>
                <button className="text-brand-700 hover:underline" onClick={() => removeAssignment(a.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
