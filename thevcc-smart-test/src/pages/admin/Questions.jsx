import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { parseBulkQuestions, toImportPayload } from '../../lib/bulkImportParser';
import { PageLoading, EmptyState, Spinner } from '../../components/States';
import ConfirmDialog from '../../components/ConfirmDialog';

const emptyOptions = { A: '', B: '', C: '', D: '' };

export default function Questions() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(emptyOptions);
  const [qAnswer, setQAnswer] = useState('A');
  const [qMarks, setQMarks] = useState(1);
  const [qExplanation, setQExplanation] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: qs }] = await Promise.all([
      supabase.from('tests').select('*').eq('id', testId).maybeSingle(),
      supabase.from('questions').select('*, question_options(*)').eq('test_id', testId).order('order_index'),
    ]);
    setTest(t);
    setQuestions(qs || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [testId]);

  const resetForm = () => {
    setQText('');
    setQOptions(emptyOptions);
    setQAnswer('A');
    setQMarks(1);
    setQExplanation('');
    setEditingId(null);
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setQText(q.question_text);
    setQMarks(q.marks);
    setQExplanation(q.explanation || '');
    const opts = { ...emptyOptions };
    let correct = 'A';
    q.question_options.forEach((o) => {
      opts[o.option_label] = o.option_text;
      if (o.is_correct) correct = o.option_label;
    });
    setQOptions(opts);
    setQAnswer(correct);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qText.trim() || !qOptions.A || !qOptions.B || !qOptions.C || !qOptions.D) {
      toast.error('Fill in the question and all four options.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await supabase.from('questions').update({ question_text: qText, marks: qMarks, explanation: qExplanation || null }).eq('id', editingId);
        for (const label of ['A', 'B', 'C', 'D']) {
          await supabase
            .from('question_options')
            .update({ option_text: qOptions[label], is_correct: label === qAnswer })
            .eq('question_id', editingId)
            .eq('option_label', label);
        }
        toast.success('Question updated.');
      } else {
        const maxOrder = questions.reduce((m, q) => Math.max(m, q.order_index), 0);
        const { data: newQ, error } = await supabase
          .from('questions')
          .insert({ test_id: testId, question_text: qText, marks: qMarks, explanation: qExplanation || null, order_index: maxOrder + 1 })
          .select()
          .single();
        if (error) throw error;
        await supabase.from('question_options').insert(
          ['A', 'B', 'C', 'D'].map((label) => ({ question_id: newQ.id, option_label: label, option_text: qOptions[label], is_correct: label === qAnswer }))
        );
        toast.success('Question added.');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (q) => {
    const maxOrder = questions.reduce((m, x) => Math.max(m, x.order_index), 0);
    const { data: newQ } = await supabase
      .from('questions')
      .insert({ test_id: testId, question_text: q.question_text, marks: q.marks, explanation: q.explanation, order_index: maxOrder + 1 })
      .select()
      .single();
    if (newQ) {
      await supabase.from('question_options').insert(
        q.question_options.map((o) => ({ question_id: newQ.id, option_label: o.option_label, option_text: o.option_text, is_correct: o.is_correct }))
      );
    }
    toast.success('Question duplicated.');
    load();
  };

  const handleDelete = async () => {
    await supabase.from('questions').delete().eq('id', deleteTarget.id);
    toast.success('Question deleted.');
    setDeleteTarget(null);
    load();
  };

  const move = async (q, direction) => {
    const idx = questions.findIndex((x) => x.id === q.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;
    const other = questions[swapIdx];
    await Promise.all([
      supabase.from('questions').update({ order_index: other.order_index }).eq('id', q.id),
      supabase.from('questions').update({ order_index: q.order_index }).eq('id', other.id),
    ]);
    load();
  };

  const handleParseBulk = () => {
    if (!bulkText.trim()) {
      toast.error('Paste some questions first.');
      return;
    }
    setBulkPreview(parseBulkQuestions(bulkText));
  };

  const handleConfirmImport = async () => {
    const payload = toImportPayload(bulkPreview);
    if (payload.length === 0) {
      toast.error('No valid questions to import.');
      return;
    }
    setImporting(true);
    try {
      const { error } = await supabase.rpc('bulk_import_questions', { p_test_id: testId, p_questions: payload });
      if (error) throw error;
      toast.success(`Imported ${payload.length} question(s).`);
      setShowBulk(false);
      setBulkText('');
      setBulkPreview(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <PageLoading />;

  const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);

  return (
    <div className="max-w-3xl">
      <Link to="/admin/tests" className="text-sm text-ink-500 hover:text-brand-700">← Back to Tests</Link>
      <div className="flex items-center justify-between flex-wrap gap-3 mt-2">
        <h1 className="text-xl font-bold text-ink-950">Questions: {test?.name}</h1>
        <button className="btn-secondary" onClick={() => setShowBulk(true)}>📋 Bulk Import</button>
      </div>
      <p className="text-sm text-ink-500 mt-1">
        {questions.length} question{questions.length === 1 ? '' : 's'} · {totalMarks} marks total
        {test && totalMarks !== Number(test.total_marks) && (
          <span className="text-brand-700"> — test's Total Marks field is set to {test.total_marks}, update it in Edit Test to match.</span>
        )}
      </p>

      <form onSubmit={handleSubmit} className="card p-6 mt-5 space-y-4">
        <h2 className="font-semibold text-ink-900">{editingId ? 'Edit Question' : 'Add Question'}</h2>
        <div>
          <label className="label">Question Text</label>
          <textarea className="input" rows={2} value={qText} onChange={(e) => setQText(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {['A', 'B', 'C', 'D'].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm font-medium w-8">
                <input type="radio" name="correct" checked={qAnswer === label} onChange={() => setQAnswer(label)} />
                {label}
              </label>
              <input
                className="input"
                placeholder={`Option ${label}`}
                value={qOptions[label]}
                onChange={(e) => setQOptions((o) => ({ ...o, [label]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-400">Select the radio button next to the correct option.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Marks</label>
            <input type="number" min="0.5" step="0.5" className="input" value={qMarks} onChange={(e) => setQMarks(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Explanation (optional)</label>
          <textarea className="input" rows={2} value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner /> : editingId ? 'Update Question' : 'Add Question'}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>

      <div className="card mt-6">
        {questions.length === 0 ? (
          <EmptyState icon="❓" title="No questions yet" description="Add questions above or use Bulk Import." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {questions.map((q, idx) => (
              <li key={q.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-ink-900">{idx + 1}. {q.question_text}</p>
                  <span className="text-xs text-ink-400 whitespace-nowrap">{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-1.5 mt-2 text-sm">
                  {q.question_options.sort((a, b) => a.option_label.localeCompare(b.option_label)).map((o) => (
                    <div key={o.option_label} className={`px-2.5 py-1 rounded ${o.is_correct ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-ink-600'}`}>
                      {o.option_label}. {o.option_text}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-2 text-xs">
                  <button className="text-ink-500 hover:underline" onClick={() => move(q, 'up')}>↑ Move Up</button>
                  <button className="text-ink-500 hover:underline" onClick={() => move(q, 'down')}>↓ Move Down</button>
                  <button className="text-brand-700 hover:underline" onClick={() => handleEdit(q)}>Edit</button>
                  <button className="text-ink-500 hover:underline" onClick={() => handleDuplicate(q)}>Duplicate</button>
                  <button className="text-brand-700 hover:underline" onClick={() => setDeleteTarget(q)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setShowBulk(false)} />
          <div className="relative card w-full max-w-2xl p-6 shadow-popover max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">Bulk Question Import</h3>
            <p className="text-xs text-ink-500 mt-1">Paste questions in this format:</p>
            <pre className="bg-ink-50 text-xs rounded-lg p-3 mt-2 overflow-x-auto text-ink-600">{`Q: What is the capital of Pakistan?
A: Karachi
B: Lahore
C: Islamabad
D: Peshawar
ANSWER: C
MARKS: 1`}</pre>
            <textarea
              className="input mt-3 font-mono text-xs"
              rows={10}
              value={bulkText}
              onChange={(e) => { setBulkText(e.target.value); setBulkPreview(null); }}
              placeholder="Paste your questions here…"
            />

            {!bulkPreview && (
              <div className="flex justify-end gap-3 mt-4">
                <button className="btn-secondary" onClick={() => setShowBulk(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleParseBulk}>Preview</button>
              </div>
            )}

            {bulkPreview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-ink-800">
                  {bulkPreview.filter((q) => q.valid).length} valid · {bulkPreview.filter((q) => !q.valid).length} with errors
                </p>
                <div className="max-h-80 overflow-y-auto mt-2 space-y-2">
                  {bulkPreview.map((q) => (
                    <div key={q.index} className={`rounded-lg border p-3 text-sm ${q.valid ? 'border-ink-200' : 'border-brand-300 bg-brand-50'}`}>
                      <p className="font-medium">{q.index}. {q.question_text || <em className="text-ink-400">Missing question</em>}</p>
                      <div className="grid grid-cols-2 gap-1 mt-1.5 text-xs text-ink-600">
                        {['A', 'B', 'C', 'D'].map((l) => (
                          <p key={l} className={q.answer === l ? 'font-semibold text-emerald-700' : ''}>{l}. {q.options[l] || '—'}</p>
                        ))}
                      </div>
                      <p className="text-xs text-ink-400 mt-1">Marks: {q.marks}</p>
                      {q.errors.length > 0 && (
                        <ul className="text-xs text-brand-700 mt-1.5 list-disc list-inside">
                          {q.errors.map((e) => <li key={e}>{e}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button className="btn-secondary" onClick={() => setBulkPreview(null)}>Back</button>
                  <button className="btn-primary" disabled={importing} onClick={handleConfirmImport}>
                    {importing ? <Spinner /> : `Confirm Import (${bulkPreview.filter((q) => q.valid).length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this question?"
        message="This cannot be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
