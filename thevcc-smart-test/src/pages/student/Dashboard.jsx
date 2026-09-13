import React, { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, Percent, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAvailableTests } from '../../lib/useAvailableTests';
import { PageLoading, EmptyState, ErrorState } from '../../components/States';
import TestCard from '../../components/TestCard';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card p-4">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accent || 'bg-brand-50 text-brand-700'}`}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-display font-bold text-ink-950 mt-3">{value}</p>
      <p className="text-xs text-ink-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function StudentDashboard() {
  const { tests, loading, error, reload } = useAvailableTests();
  const [perf, setPerf] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_student_performance');
      if (data && data[0]) setPerf(data[0]);
    })();
  }, []);

  const completed = tests.filter((t) => t.attempt && t.attempt.status !== 'in_progress').length;
  const pending = tests.length - completed;

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-950">Welcome back</h1>
      <p className="text-sm text-ink-500 mt-1">Track your tests, results, and academic performance.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        <StatCard icon={ClipboardList} label="Total Tests" value={tests.length} />
        <StatCard icon={CheckCircle2} label="Completed" value={completed} accent="bg-emerald-50 text-emerald-700" />
        <StatCard icon={Clock} label="Pending" value={pending} accent="bg-gold-100 text-gold-700" />
        <StatCard icon={Percent} label="Average %" value={perf ? `${perf.average_percentage}%` : '—'} />
        <StatCard icon={Trophy} label="Best Score" value={perf ? `${perf.best_percentage}%` : '—'} accent="bg-gold-100 text-gold-700" />
        <StatCard icon={TrendingUp} label="Tests Passed" value={perf ? perf.pass_count : '—'} accent="bg-emerald-50 text-emerald-700" />
      </div>

      <h2 className="text-base font-semibold text-ink-900 mt-8 mb-4">Available Tests</h2>
      {loading && <PageLoading label="Loading your tests…" />}
      {!loading && error && <ErrorState description="Could not load tests." onRetry={reload} />}
      {!loading && !error && tests.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={36} className="mx-auto text-ink-300" />}
          title="No tests available yet"
          description="Your teacher hasn't assigned any tests yet. Check back later."
        />
      )}
      {!loading && !error && tests.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((t) => (
            <TestCard key={t.id} test={t} />
          ))}
        </div>
      )}
    </div>
  );
}
