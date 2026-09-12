import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, ErrorState } from '../../components/States';

export default function AttemptDetail() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: a, error: err } = await supabase
        .from('test_attempts')
        .select('*, students(student_id, class, section, profiles(full_name)), tests(name, subjects(name))')
        .eq('id', attemptId)
        .maybeSingle();
      if (err || !a) {
        setError('Attempt not found.');
        setLoading(false);
        return;
      }
      setAttempt(a);

      const { data: qs } = await supabase
        .from('questions')
        .select('*, question_options(*)')
        .eq('test_id', a.test_id)
        .order('order_index');

      const { data: answers } = await supabase.from('student_answers').select('*').eq('attempt_id', attemptId);
      const answerMap = {};
      (answers || []).forEach((ans) => { answerMap[ans.question_id] = ans; });

      const merged = (qs || []).map((q) => ({
        ...q,
        answer: answerMap[q.id],
        correct: q.question_options.find((o) => o.is_correct),
      }));
      setRows(merged);
      setLoading(false);
    })();
  }, [attemptId]);

  if (loading) return <PageLoading />;
  if (error) return <ErrorState description={error} />;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/results" className="text-sm text-ink-500 hover:text-brand-700">← Back to Results</Link>

      <div className="card p-6 mt-3">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <p><span className="text-ink-400">Student:</span> {attempt.students?.profiles?.full_name} ({attempt.students?.student_id})</p>
          <p><span className="text-ink-400">Class/Section:</span> {attempt.students?.class} {attempt.students?.section}</p>
          <p><span className="text-ink-400">Test:</span> {attempt.tests?.name}</p>
          <p><span className="text-ink-400">Subject:</span> {attempt.tests?.subjects?.name || '—'}</p>
          <p><span className="text-ink-400">Started:</span> {new Date(attempt.started_at).toLocaleString()}</p>
          <p><span className="text-ink-400">Submitted:</span> {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : '—'}</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5">
          {[
            ['Marks', `${attempt.obtained_marks}/${attempt.total_marks}`],
            ['%', `${attempt.percentage}%`],
            ['Grade', attempt.grade],
            ['Status', attempt.result_status],
            ['Correct', attempt.correct_answers],
            ['Wrong', attempt.wrong_answers],
          ].map(([label, val]) => (
            <div key={label} className="rounded-lg bg-ink-50 px-3 py-2 text-center">
              <p className="text-xs text-ink-400">{label}</p>
              <p className="font-semibold text-ink-900">{val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-6 divide-y divide-ink-100">
        {rows.map((q, idx) => {
          const selected = q.answer?.selected_option;
          const isCorrect = q.answer?.is_correct;
          return (
            <div key={q.id} className="p-5">
              <div className="flex justify-between gap-3">
                <p className="text-sm font-medium text-ink-900">{idx + 1}. {q.question_text}</p>
                <span className={`badge shrink-0 ${selected == null ? 'badge-gray' : isCorrect ? 'badge-green' : 'badge-red'}`}>
                  {selected == null ? 'Unanswered' : isCorrect ? 'Correct' : 'Wrong'}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-1.5 mt-2 text-sm">
                {q.question_options.sort((a, b) => a.option_label.localeCompare(b.option_label)).map((o) => {
                  const isSelected = o.option_label === selected;
                  const isTheCorrect = o.is_correct;
                  return (
                    <div
                      key={o.option_label}
                      className={`px-2.5 py-1 rounded ${
                        isTheCorrect ? 'bg-emerald-50 text-emerald-700 font-medium' : isSelected ? 'bg-brand-50 text-brand-700' : 'text-ink-600'
                      }`}
                    >
                      {o.option_label}. {o.option_text} {isSelected && '(selected)'} {isTheCorrect && '✓'}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-ink-400 mt-1.5">Marks obtained: {q.answer?.marks_obtained ?? 0} / {q.marks}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
