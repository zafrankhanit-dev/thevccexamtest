import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, Spinner, ErrorState } from '../../components/States';
import Logo from '../../components/Logo';

const RULES = [
  'Read every question carefully.',
  'Select the best answer.',
  'You can move between questions.',
  'Do not refresh or close the browser during the test.',
  'The test will automatically submit when time expires.',
  'Once submitted, the test cannot be changed.',
];

export default function Instructions() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('tests')
        .select('id, name, duration_minutes, total_marks, passing_percentage, negative_marking, negative_marks, subjects(name)')
        .eq('id', testId)
        .maybeSingle();
      if (err || !data) {
        setError('This test is not available.');
      } else {
        setTest(data);
      }
      setLoading(false);
    })();
  }, [testId]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const { data, error: err } = await supabase.rpc('start_test_attempt', { p_test_id: testId });
      if (err) throw err;
      const attempt = Array.isArray(data) ? data[0] : data;
      navigate(`/student/exam/${attempt.attempt_id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not start the test.');
      setStarting(false);
    }
  };

  if (loading) return <PageLoading label="Loading test…" />;
  if (error || !test) return <ErrorState description={error} />;

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-5">
          <Logo />
        </div>
        <div className="card p-6 md:p-8">
          <h1 className="text-lg font-bold text-ink-950">Test Instructions</h1>
          <p className="text-sm text-ink-500 mt-1">{test.name} {test.subjects?.name ? `· ${test.subjects.name}` : ''}</p>

          <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
            <div className="rounded-lg bg-ink-50 px-3 py-2">
              <p className="text-ink-400 text-xs">Duration</p>
              <p className="font-semibold">{test.duration_minutes} minutes</p>
            </div>
            <div className="rounded-lg bg-ink-50 px-3 py-2">
              <p className="text-ink-400 text-xs">Total Marks</p>
              <p className="font-semibold">{test.total_marks}</p>
            </div>
            <div className="rounded-lg bg-ink-50 px-3 py-2">
              <p className="text-ink-400 text-xs">Passing</p>
              <p className="font-semibold">{test.passing_percentage}%</p>
            </div>
            <div className="rounded-lg bg-ink-50 px-3 py-2">
              <p className="text-ink-400 text-xs">Negative Marking</p>
              <p className="font-semibold">{test.negative_marking ? `On (−${test.negative_marks})` : 'Off'}</p>
            </div>
          </div>

          <ul className="mt-6 space-y-2.5">
            {RULES.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-sm text-ink-700">
                <span className="text-brand-700 mt-0.5">•</span>
                {rule}
              </li>
            ))}
          </ul>

          <button onClick={handleStart} disabled={starting} className="btn-primary w-full mt-7">
            {starting ? <Spinner /> : 'I Understand & Start Test'}
          </button>
          <Link to="/student" className="block text-center text-sm text-ink-500 hover:text-brand-700 mt-4">
            Cancel and go back
          </Link>
        </div>
      </div>
    </div>
  );
}
