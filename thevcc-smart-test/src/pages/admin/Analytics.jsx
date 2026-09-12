import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading } from '../../components/States';

function Card({ title, children }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-ink-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-2xl font-display font-bold text-ink-950 mt-1">{value}</p>
    </div>
  );
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [totalTests, setTotalTests] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: a }, { count: tCount }] = await Promise.all([
        supabase
          .from('test_attempts')
          .select('percentage, result_status, submitted_at, students(class, profiles(full_name)), tests(name, subjects(name))')
          .neq('status', 'in_progress'),
        supabase.from('tests').select('id', { count: 'exact', head: true }),
      ]);
      setAttempts(a || []);
      setTotalTests(tCount || 0);
      setLoading(false);
    })();
  }, []);

  const overallAvg = useMemo(
    () => (attempts.length ? (attempts.reduce((s, a) => s + Number(a.percentage || 0), 0) / attempts.length).toFixed(1) : 0),
    [attempts]
  );
  const passRate = useMemo(() => {
    if (!attempts.length) return 0;
    return ((attempts.filter((a) => a.result_status === 'PASS').length / attempts.length) * 100).toFixed(1);
  }, [attempts]);
  const failRate = attempts.length ? (100 - passRate).toFixed(1) : 0;

  const mostAttempted = useMemo(() => {
    const map = {};
    attempts.forEach((a) => {
      const name = a.tests?.name || 'Unknown';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [attempts]);

  const topStudents = useMemo(() => {
    const map = {};
    attempts.forEach((a) => {
      const name = a.students?.profiles?.full_name || 'Unknown';
      if (!map[name]) map[name] = [];
      map[name].push(Number(a.percentage || 0));
    });
    return Object.entries(map)
      .map(([name, scores]) => ({ name, average: scores.reduce((x, y) => x + y, 0) / scores.length }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 6)
      .map((s) => ({ ...s, average: Number(s.average.toFixed(1)) }));
  }, [attempts]);

  const subjectAvg = useMemo(() => {
    const map = {};
    attempts.forEach((a) => {
      const subj = a.tests?.subjects?.name || 'General';
      if (!map[subj]) map[subj] = [];
      map[subj].push(Number(a.percentage || 0));
    });
    return Object.entries(map).map(([subject, scores]) => ({
      subject,
      average: Number((scores.reduce((x, y) => x + y, 0) / scores.length).toFixed(1)),
    }));
  }, [attempts]);

  const classAvg = useMemo(() => {
    const map = {};
    attempts.forEach((a) => {
      const klass = a.students?.class || 'Unassigned';
      if (!map[klass]) map[klass] = [];
      map[klass].push(Number(a.percentage || 0));
    });
    return Object.entries(map).map(([klass, scores]) => ({
      klass,
      average: Number((scores.reduce((x, y) => x + y, 0) / scores.length).toFixed(1)),
    }));
  }, [attempts]);

  const dailyAttempts = useMemo(() => {
    const map = {};
    attempts.forEach((a) => {
      if (!a.submitted_at) return;
      const day = new Date(a.submitted_at).toLocaleDateString();
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => new Date(a.day) - new Date(b.day))
      .slice(-14);
  }, [attempts]);

  if (loading) return <PageLoading />;

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-950">Analytics</h1>
      <p className="text-sm text-ink-500 mt-1">Performance insights across TheVCC Smart Test.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Stat label="Overall Average" value={`${overallAvg}%`} />
        <Stat label="Pass Rate" value={`${passRate}%`} />
        <Stat label="Fail Rate" value={`${failRate}%`} />
        <Stat label="Total Tests" value={totalTests} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        <Card title="Most Attempted Tests">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mostAttempted} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#93171a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Highest Performing Students">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topStudents} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="average" fill="#059669" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Subject-wise Average">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectAvg}>
              <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="average" fill="#93171a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Class-wise Performance">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={classAvg}>
              <XAxis dataKey="klass" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="average" fill="#525c6c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Daily Test Attempts (last 14 days)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyAttempts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#93171a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
