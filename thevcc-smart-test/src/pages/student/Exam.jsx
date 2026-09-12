import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { PageLoading, ErrorState, Spinner } from '../../components/States';
import ConfirmDialog from '../../components/ConfirmDialog';

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function Exam() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testInfo, setTestInfo] = useState(null); // { name, duration_minutes }
  const [deadline, setDeadline] = useState(null); // Date the timer hits zero
  const [remaining, setRemaining] = useState(0);
  const [questions, setQuestions] = useState([]); // grouped: { question_id, question_text, marks, options: [...], selected }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const savingRef = useRef({});

  const loadExam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: attempt, error: attErr } = await supabase
        .from('test_attempts')
        .select('id, test_id, started_at, status, tests(name, duration_minutes)')
        .eq('id', attemptId)
        .maybeSingle();
      if (attErr || !attempt) throw new Error('Test attempt not found.');

      if (attempt.status !== 'in_progress') {
        navigate(`/student/result/${attemptId}`, { replace: true });
        return;
      }

      const startedAt = new Date(attempt.started_at);
      const durationMs = attempt.tests.duration_minutes * 60 * 1000;
      const deadlineDate = new Date(startedAt.getTime() + durationMs);
      setTestInfo({ name: attempt.tests.name, duration_minutes: attempt.tests.duration_minutes });
      setDeadline(deadlineDate);
      setRemaining(Math.max(0, (deadlineDate.getTime() - Date.now()) / 1000));

      const { data: rows, error: qErr } = await supabase.rpc('get_exam_questions', { p_attempt_id: attemptId });
      if (qErr) throw qErr;

      const map = new Map();
      (rows || []).forEach((r) => {
        if (!map.has(r.question_id)) {
          map.set(r.question_id, {
            question_id: r.question_id,
            question_text: r.question_text,
            marks: r.marks,
            order_index: r.order_index,
            selected: r.selected_option,
            options: [],
          });
        }
        map.get(r.question_id).options.push({ label: r.option_label, text: r.option_text });
      });
      const list = Array.from(map.values()).sort((a, b) => a.order_index - b.order_index);
      list.forEach((q) => q.options.sort((a, b) => a.label.localeCompare(b.label)));
      setQuestions(list);
    } catch (err) {
      setError(err.message || 'Could not load the test.');
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  // Warn before closing/refreshing the tab mid-test.
  useEffect(() => {
    const handler = (e) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const doSubmit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const { error: err } = await supabase.rpc('submit_test_attempt', { p_attempt_id: attemptId, p_auto: auto });
        if (err) throw err;
        navigate(`/student/result/${attemptId}`, { replace: true });
      } catch (err) {
        submittedRef.current = false;
        setSubmitting(false);
        toast.error(err.message || 'Could not submit the test.');
      }
    },
    [attemptId, navigate]
  );

  // Timer tick, derived from the fixed deadline — refresh-safe.
  useEffect(() => {
    if (!deadline) return undefined;
    const tick = () => {
      const secs = (deadline.getTime() - Date.now()) / 1000;
      setRemaining(secs);
      if (secs <= 0) {
        doSubmit(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, doSubmit]);

  const answeredCount = useMemo(() => questions.filter((q) => q.selected).length, [questions]);
  const unansweredCount = questions.length - answeredCount;

  const handleSelect = async (questionId, label) => {
    setQuestions((prev) => prev.map((q) => (q.question_id === questionId ? { ...q, selected: label } : q)));
    savingRef.current[questionId] = true;
    try {
      await supabase.rpc('save_answer', { p_attempt_id: attemptId, p_question_id: questionId, p_selected_option: label });
    } catch (err) {
      toast.error('Could not save that answer — try again.');
    } finally {
      savingRef.current[questionId] = false;
    }
  };

  if (loading) return <PageLoading label="Loading your test…" />;
  if (error) return <ErrorState description={error} />;
  if (questions.length === 0) return <ErrorState title="No questions in this test" description="Contact the administrator." />;

  const q = questions[currentIndex];
  const lowTime = remaining <= 60;

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <header className="bg-white border-b border-ink-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs text-brand-700 font-semibold">TheVCC Smart Test</p>
            <p className="text-sm font-semibold text-ink-900 truncate">{testInfo?.name}</p>
            <p className="text-xs text-ink-400">{profile?.full_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-ink-500">
              Question <span className="font-semibold text-ink-800">{currentIndex + 1}</span> of {questions.length}
            </div>
            <div
              className={`font-display font-bold text-lg px-3 py-1.5 rounded-lg tabular-nums ${
                lowTime ? 'bg-brand-700 text-white animate-pulse' : 'bg-ink-100 text-ink-800'
              }`}
            >
              {formatTime(remaining)}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 grid md:grid-cols-[1fr_240px] gap-6">
        <div className="card p-5 md:p-7">
          <p className="text-base font-semibold text-ink-950 leading-relaxed">
            {currentIndex + 1}. {q.question_text}
          </p>
          <p className="text-xs text-ink-400 mt-1">{q.marks} mark{q.marks === 1 ? '' : 's'}</p>

          <div className="mt-5 space-y-2.5">
            {q.options.map((opt) => {
              const active = q.selected === opt.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => handleSelect(q.question_id, opt.label)}
                  className={`w-full text-left rounded-lg border px-4 py-3 text-sm flex items-start gap-3 transition ${
                    active
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : 'border-ink-200 hover:border-brand-300 hover:bg-ink-50 text-ink-800'
                  }`}
                >
                  <span
                    className={`shrink-0 h-6 w-6 rounded-full border flex items-center justify-center text-xs font-semibold ${
                      active ? 'bg-brand-700 border-brand-700 text-white' : 'border-ink-300 text-ink-500'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="pt-0.5">{opt.text}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-7 gap-3 flex-wrap">
            <button
              className="btn-secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              ← Previous
            </button>
            <div className="flex gap-3">
              {currentIndex < questions.length - 1 ? (
                <button className="btn-primary" onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
                  Save &amp; Next →
                </button>
              ) : (
                <button className="btn-primary" onClick={() => setConfirmSubmit(true)}>
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="card p-4 h-fit md:sticky md:top-20">
          <p className="text-sm font-semibold text-ink-900 mb-1">Question Navigation</p>
          <p className="text-xs text-ink-400 mb-3">
            {answeredCount} answered · {unansweredCount} unanswered
          </p>
          <div className="grid grid-cols-6 md:grid-cols-5 gap-2">
            {questions.map((qq, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = !!qq.selected;
              return (
                <button
                  key={qq.question_id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 w-9 rounded-md text-xs font-semibold flex items-center justify-center border transition ${
                    isCurrent
                      ? 'bg-brand-700 border-brand-700 text-white'
                      : isAnswered
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white border-ink-200 text-ink-500'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-xs text-ink-500">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-brand-700" /> Current</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-emerald-50 border border-emerald-300" /> Answered</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-white border border-ink-200" /> Unanswered</div>
          </div>
          <button onClick={() => setConfirmSubmit(true)} className="btn-danger w-full mt-5">
            Submit Test
          </button>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit test?"
        message={
          unansweredCount > 0
            ? `You still have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}. Are you sure you want to submit?`
            : 'Are you sure you want to submit your test?'
        }
        confirmLabel={submitting ? 'Submitting…' : 'Submit'}
        onCancel={() => setConfirmSubmit(false)}
        onConfirm={() => {
          setConfirmSubmit(false);
          doSubmit(false);
        }}
      />
      {submitting && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 text-brand-700">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-ink-600">Calculating your result…</p>
          </div>
        </div>
      )}
    </div>
  );
}
