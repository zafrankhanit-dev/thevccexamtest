import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, ErrorState } from '../../components/States';

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-ink-50 px-4 py-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="font-semibold text-ink-900 mt-0.5">{value}</p>
    </div>
  );
}

export default function Result() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase.rpc('get_attempt_result', { p_attempt_id: attemptId });
      if (err || !data || !data[0]) {
        setError(err?.message || 'Result not found.');
      } else {
        setResult(data[0]);
      }
      setLoading(false);
    })();
  }, [attemptId]);

  if (loading) return <PageLoading label="Loading your result…" />;
  if (error || !result) return <ErrorState description={error} />;

  const pass = result.result_status === 'PASS';

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="card overflow-hidden">
          <div className={`px-6 py-6 text-center text-white ${pass ? 'bg-emerald-600' : 'bg-brand-700'}`}>
            <p className="text-sm opacity-90">{pass ? 'Congratulations!' : 'Test submitted'}</p>
            <p className="text-3xl font-display font-bold mt-1">{result.result_status}</p>
            <p className="opacity-90 text-sm mt-1">{result.percentage}% · Grade {result.grade}</p>
          </div>

          <div className="p-6">
            <div className="text-sm text-ink-500 grid grid-cols-2 gap-y-1 mb-5">
              <p><span className="text-ink-400">Student:</span> {result.student_name}</p>
              <p><span className="text-ink-400">ID:</span> {result.student_code}</p>
              <p className="col-span-2"><span className="text-ink-400">Test:</span> {result.test_name} {result.subject_name ? `· ${result.subject_name}` : ''}</p>
              <p><span className="text-ink-400">Started:</span> {new Date(result.started_at).toLocaleString()}</p>
              <p><span className="text-ink-400">Submitted:</span> {new Date(result.submitted_at).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total Questions" value={result.total_questions} />
              <Stat label="Attempted" value={result.attempted_questions} />
              <Stat label="Correct Answers" value={result.correct_answers} />
              <Stat label="Wrong Answers" value={result.wrong_answers} />
              <Stat label="Total Marks" value={result.total_marks} />
              <Stat label="Obtained Marks" value={result.obtained_marks} />
            </div>

            <Link to="/student" className="btn-primary w-full mt-6">
              Back to Dashboard
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-ink-400 mt-5">
          This result is only available right after submission. Contact the administrator for older results.
        </p>
      </div>
    </div>
  );
}
