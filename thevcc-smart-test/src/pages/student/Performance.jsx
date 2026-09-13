import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, EmptyState } from '../../components/States';

function Stat({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-xl font-display font-bold text-ink-950 mt-1">{value}</p>
    </div>
  );
}

const PIE_COLORS = ['#059669', '#93171a', '#8691a0'];

export default function Performance() {
  const [loading, setLoading] = useState(true);
  const [perf, setPerf] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: h }] = await Promise.all([
        supabase.rpc('get_student_performance'),
        supabase.rpc('get_student_test_history'),
      ]);
      setPerf(p && p[0] ? p[0] : null);
      setHistory((h || []).slice().reverse()); // chronological
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoading label="Loading your performance…" />;

  if (!perf || perf.total_tests === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-ink-950">Performance</h1>
        <div className="mt-6">
          <EmptyState
            icon={<BarChart3 size={36} className="mx-auto text-ink-300" />}
            title="Complete your first test to see your performance"
          />
        </div>
      </div>
    );
  }

  const trendData = history.map((h) => ({
    name: h.test_name.length > 12 ? `${h.test_name.slice(0, 12)}…` : h.test_name,
    percentage: Number(h.percentage || 0),
  }));

  const pieData = [
    { name: 'Correct', value: perf.total_correct },
    { name: 'Wrong', value: perf.total_wrong },
    { name: 'Unattempted', value: perf.total_unattempted },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-950">Performance</h1>
      <p className="text-sm text-ink-500 mt-1">Your academic performance across all tests.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Stat label="Total Tests" value={perf.total_tests} />
        <Stat label="Average %" value={`${perf.average_percentage}%`} />
        <Stat label="Best Score" value={`${perf.best_percentage}%`} />
        <Stat label="Passed" value={`${perf.pass_count} / ${perf.total_tests}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        <div className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-3">Performance Over Time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="percentage" fill="#93171a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-3">Correct vs Wrong vs Unattempted</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, idx) => (
                  <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
