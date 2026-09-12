import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, EmptyState, ErrorState } from '../../components/States';

export default function StudentDetail() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: s, error: sErr } = await supabase
        .from('students')
        .select('*, profiles(full_name)')
        .eq('id', studentId)
        .maybeSingle();
      if (sErr || !s) {
        setError('Student not found.');
        setLoading(false);
        return;
      }
      setStudent(s);

      const { data: a } = await supabase
        .from('test_attempts')
        .select('*, tests(name, subjects(name))')
        .eq('student_id', studentId)
        .neq('status', 'in_progress')
        .order('submitted_at', { ascending: false });
      setAttempts(a || []);
      setLoading(false);
    })();
  }, [studentId]);

  const subjectStats = useMemo(() => {
    const map = {};
    attempts.forEach((a) => {
      const subj = a.tests?.subjects?.name || 'General';
      if (!map[subj]) map[subj] = { subject: subj, scores: [], pass: 0 };
      map[subj].scores.push(Number(a.percentage || 0));
      if (a.result_status === 'PASS') map[subj].pass += 1;
    });
    return Object.values(map).map((s) => ({
      subject: s.subject,
      testsTaken: s.scores.length,
      average: (s.scores.reduce((x, y) => x + y, 0) / s.scores.length).toFixed(1),
      highest: Math.max(...s.scores).toFixed(1),
      lowest: Math.min(...s.scores).toFixed(1),
      passRate: ((s.pass / s.scores.length) * 100).toFixed(0),
    }));
  }, [attempts]);

  if (loading) return <PageLoading />;
  if (error) return <ErrorState description={error} />;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/students" className="text-sm text-ink-500 hover:text-brand-700">← Back to Students</Link>

      <div className="card p-6 mt-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-ink-950">{student.profiles?.full_name}</h1>
            <p className="text-sm text-ink-500">
              {student.student_id} · {student.class || '—'} {student.section}
            </p>
          </div>
          <span className={student.status ? 'badge-green' : 'badge-red'}>{student.status ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      <div className="card mt-6">
        <div className="px-5 py-4 border-b border-ink-100 font-semibold text-ink-900">Subject-wise Performance</div>
        {subjectStats.length === 0 ? (
          <EmptyState icon="📈" title="No attempts yet" />
        ) : (
          <div className="table-wrap border-0 rounded-none">
            <table className="table-base">
              <thead>
                <tr><th>Subject</th><th>Tests Taken</th><th>Average</th><th>Highest</th><th>Lowest</th><th>Pass Rate</th></tr>
              </thead>
              <tbody>
                {subjectStats.map((s) => (
                  <tr key={s.subject}>
                    <td>{s.subject}</td>
                    <td>{s.testsTaken}</td>
                    <td>{s.average}%</td>
                    <td>{s.highest}%</td>
                    <td>{s.lowest}%</td>
                    <td>{s.passRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mt-6">
        <div className="px-5 py-4 border-b border-ink-100 font-semibold text-ink-900">All Test Attempts</div>
        {attempts.length === 0 ? (
          <EmptyState icon="📝" title="No attempts yet" />
        ) : (
          <div className="table-wrap border-0 rounded-none">
            <table className="table-base">
              <thead>
                <tr><th>Test</th><th>Subject</th><th>Date</th><th>Marks</th><th>%</th><th>Grade</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.tests?.name}</td>
                    <td>{a.tests?.subjects?.name || '—'}</td>
                    <td>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '—'}</td>
                    <td>{a.obtained_marks}/{a.total_marks}</td>
                    <td>{a.percentage}%</td>
                    <td>{a.grade}</td>
                    <td><span className={a.result_status === 'PASS' ? 'badge-green' : 'badge-red'}>{a.result_status}</span></td>
                    <td><Link to={`/admin/attempts/${a.id}`} className="text-brand-700 text-sm font-medium hover:underline">View</Link></td>
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
