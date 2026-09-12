import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, EmptyState } from '../../components/States';

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-ink-400">{label}</p>
      <p className={`text-2xl font-display font-bold mt-1 ${accent || 'text-ink-950'}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [
        { count: totalStudents },
        { count: activeUsers },
        { count: lockedUsers },
        { count: totalTests },
        { count: totalAttempts },
        { data: attemptStats },
        { data: recentAttempts },
      ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', true),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', false),
        supabase.from('tests').select('id', { count: 'exact', head: true }),
        supabase.from('test_attempts').select('id', { count: 'exact', head: true }).neq('status', 'in_progress'),
        supabase.from('test_attempts').select('percentage, result_status').neq('status', 'in_progress'),
        supabase
          .from('test_attempts')
          .select('id, submitted_at, percentage, grade, result_status, students(student_id, profiles(full_name)), tests(name, subjects(name))')
          .neq('status', 'in_progress')
          .order('submitted_at', { ascending: false })
          .limit(8),
      ]);

      const avgPct = attemptStats?.length
        ? (attemptStats.reduce((s, a) => s + Number(a.percentage || 0), 0) / attemptStats.length).toFixed(1)
        : 0;
      const passCount = attemptStats?.filter((a) => a.result_status === 'PASS').length || 0;
      const passRate = attemptStats?.length ? ((passCount / attemptStats.length) * 100).toFixed(1) : 0;
      const failRate = attemptStats?.length ? (100 - passRate).toFixed(1) : 0;

      setStats({
        totalStudents: totalStudents || 0,
        activeUsers: activeUsers || 0,
        lockedUsers: lockedUsers || 0,
        totalTests: totalTests || 0,
        totalAttempts: totalAttempts || 0,
        avgPct,
        passRate,
        failRate,
      });
      setRecent(recentAttempts || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoading label="Loading dashboard…" />;

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-950">Dashboard</h1>
      <p className="text-sm text-ink-500 mt-1">Overview of TheVCC Smart Test.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard label="Total Students" value={stats.totalStudents} />
        <StatCard label="Active Users" value={stats.activeUsers} accent="text-emerald-600" />
        <StatCard label="Locked Users" value={stats.lockedUsers} accent="text-brand-700" />
        <StatCard label="Total Tests" value={stats.totalTests} />
        <StatCard label="Total Attempts" value={stats.totalAttempts} />
        <StatCard label="Average %" value={`${stats.avgPct}%`} />
        <StatCard label="Pass Rate" value={`${stats.passRate}%`} accent="text-emerald-600" />
        <StatCard label="Fail Rate" value={`${stats.failRate}%`} accent="text-brand-700" />
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h2 className="font-semibold text-ink-900">Recent Attempts</h2>
          <Link to="/admin/results" className="text-sm text-brand-700 font-medium hover:underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon="🗒️" title="No attempts yet" description="Results will appear here once students start taking tests." />
        ) : (
          <div className="table-wrap border-0 rounded-none">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Test</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id}>
                    <td>{a.students?.profiles?.full_name} <span className="text-ink-400">({a.students?.student_id})</span></td>
                    <td>{a.tests?.name}</td>
                    <td>{a.tests?.subjects?.name || '—'}</td>
                    <td>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '—'}</td>
                    <td>{a.percentage}% ({a.grade})</td>
                    <td>
                      <span className={a.result_status === 'PASS' ? 'badge-green' : 'badge-red'}>{a.result_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
