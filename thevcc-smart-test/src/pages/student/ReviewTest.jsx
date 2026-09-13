import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, MinusCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, ErrorState } from '../../components/States';

function statusOf(q) {
  if (q.selected_option == null) return 'unattempted';
  return q.was_correct ? 'correct' : 'incorrect';
}

const STATUS_STYLES = {
  correct: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  incorrect: { chip: 'bg-brand-50 text-brand-700 border-brand-200', dot: 'bg-brand-600' },
  unattempted: { chip: 'bg-ink-100 text-ink-600 border-ink-200', dot: 'bg-ink-400' },
};

export default function ReviewTest() {
  const { attemptId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase.rpc('get_student_attempt_review', { p_attempt_id: attemptId });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const map = new Map();
      (data || []).forEach((r) => {
        if (!map.has(r.question_id)) {
          map.set(r.question_id, {
            question_id: r.question_id,
            question_text: r.question_text,
            marks: r.marks,
            order_index: r.order_index,
            selected_option: r.selected_option,
            was_correct: r.was_correct,
            options: [],
          });
        }
        map.get(r.question_id).options.push({
          label: r.option_label,
          text: r.option_text,
          is_correct: r.is_correct_option,
        });
      });
      const list = Array.from(map.values()).sort((a, b) => a.order_index - b.order_index);
      list.forEach((q) => q.options.sort((a, b) => a.label.localeCompare(b.label)));
      setQuestions(list);
      setLoading(false);
    })();
  }, [attemptId]);

  const legend = useMemo(
    () => [
      { key: 'correct', label: 'Correct', icon: CheckCircle2 },
      { key: 'incorrect', label: 'Incorrect', icon: XCircle },
      { key: 'unattempted', label: 'Not Attempted', icon: MinusCircle },
    ],
    []
  );

  if (loading) return <PageLoading label="Loading review…" />;
  if (error) return <ErrorState description={error} />;
  if (questions.length === 0) return <ErrorState title="No questions found for this attempt" />;

  const q = questions[current];
  const status = statusOf(q);
  const correctOption = q.options.find((o) => o.is_correct);
  const selectedOption = q.options.find((o) => o.label === q.selected_option);
  const StatusIcon = status === 'correct' ? CheckCircle2 : status === 'incorrect' ? XCircle : MinusCircle;

  return (
    <div>
      <Link to="/student/history" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700">
        <ArrowLeft size={14} /> Back to Test History
      </Link>
      <h1 className="text-xl font-bold text-ink-950 mt-2">Review Test</h1>

      <div className="card p-4 mt-5">
        <p className="text-sm font-semibold text-ink-900 mb-2">Question Navigation</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((qq, idx) => {
            const s = statusOf(qq);
            const isCurrent = idx === current;
            return (
              <button
                key={qq.question_id}
                onClick={() => setCurrent(idx)}
                className={`h-9 w-9 rounded-md text-xs font-semibold flex items-center justify-center border transition ${
                  isCurrent ? 'ring-2 ring-brand-600' : ''
                } ${STATUS_STYLES[s].chip}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-ink-500">
          {legend.map((l) => {
            const Icon = l.icon;
            return (
              <div key={l.key} className="flex items-center gap-1.5">
                <Icon size={14} className={STATUS_STYLES[l.key].chip.split(' ')[1]} />
                {l.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-6 mt-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-semibold text-ink-950 leading-relaxed">
            Question {current + 1}. {q.question_text}
          </p>
          <span className={`badge shrink-0 border ${STATUS_STYLES[status].chip}`}>
            <StatusIcon size={13} />
            {status === 'correct' ? 'Correct' : status === 'incorrect' ? 'Incorrect' : 'Not Attempted'}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 mt-4">
          {q.options.map((opt) => {
            const isSelected = opt.label === q.selected_option;
            const isCorrect = opt.is_correct;
            return (
              <div
                key={opt.label}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                    : isSelected
                    ? 'bg-brand-50 border-brand-200 text-brand-800'
                    : 'border-ink-200 text-ink-700'
                }`}
              >
                {opt.label}. {opt.text}
              </div>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm">
          <div className="rounded-lg bg-ink-50 px-3 py-2.5">
            <p className="text-xs text-ink-400">Your Answer</p>
            <p className="font-medium text-ink-900">
              {selectedOption ? `${selectedOption.label}. ${selectedOption.text}` : 'Not attempted'}
            </p>
          </div>
          <div className="rounded-lg bg-ink-50 px-3 py-2.5">
            <p className="text-xs text-ink-400">Correct Answer</p>
            <p className="font-medium text-ink-900">
              {correctOption ? `${correctOption.label}. ${correctOption.text}` : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent((i) => Math.max(0, i - 1))}>
            ← Previous
          </button>
          <button
            className="btn-primary"
            disabled={current === questions.length - 1}
            onClick={() => setCurrent((i) => Math.min(questions.length - 1, i + 1))}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
