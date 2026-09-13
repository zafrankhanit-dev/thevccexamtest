import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, EmptyState, ErrorState } from '../../components/States';

export default function TestHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('get_student_test_history');
    if (err) setError(err.message);
    else setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoading label="Loading your test history…" />;
  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-950">Test History</h1>
      <p className="text-sm text-ink-500 mt-1">Every test you have completed.</p>

      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={<History size={36} className="mx-auto text-ink-300" />}
            title="No completed tests yet"
            description="Once you submit a test, it will appear here."
          />
        ) : (
          <div className="grid gap-3">
            {rows.map((r) => (
              <div key={r.attempt_id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900 truncate">{r.test_name}</p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {r.subject_name || 'General'} {r.class ? `· ${r.class}` : ''}{' '}
                    {r.submitted_at ? `· ${new Date(r.submitted_at).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink-900">{r.percentage}%</p>
                    <p className={`text-xs font-medium ${r.result_status === 'PASS' ? 'text-emerald-600' : 'text-brand-700'}`}>
                      {r.result_status}
                    </p>
                  </div>
                  <Link to={`/student/review/${r.attempt_id}`} className="btn-secondary py-2 gap-1.5">
                    <Eye size={16} /> Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
