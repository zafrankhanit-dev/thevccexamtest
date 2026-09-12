import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, EmptyState } from '../../components/States';
import { downloadCsv } from '../../lib/csv';

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);

  const runReport = async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    const { data } = await supabase
      .from('test_attempts')
      .select('id, submitted_at, percentage, grade, result_status, total_marks, obtained_marks, students(student_id, profiles(full_name)), tests(name, subjects(name))')
      .neq('status', 'in_progress')
      .gte('submitted_at', `${dateFrom}T00:00:00`)
      .lte('submitted_at', `${dateTo}T23:59:59`)
      .order('submitted_at', { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  const exportCsv = () => {
    if (!rows) return;
    downloadCsv(`report_${dateFrom}_to_${dateTo}.csv`, rows.map((r) => ({
      Student: r.students?.profiles?.full_name,
      'Student ID': r.students?.student_id,
      Test: r.tests?.name,
      Subject: r.tests?.subjects?.name,
      Marks: `${r.obtained_marks}/${r.total_marks}`,
      Percentage: r.percentage,
      Grade: r.grade,
      Status: r.result_status,
    })));
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-950">Reports</h1>
      <p className="text-sm text-ink-500 mt-1">Generate a date-wise report of every test attempt.</p>

      <div className="card p-5 mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">From Date</label>
          <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To Date</label>
          <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={runReport}>Generate Report</button>
        {rows && rows.length > 0 && <button className="btn-secondary" onClick={exportCsv}>⬇ Export CSV</button>}
      </div>

      <div className="card mt-6">
        {loading ? (
          <PageLoading />
        ) : rows === null ? (
          <EmptyState icon="🗓️" title="Pick a date range" description="Choose From and To dates, then generate the report." />
        ) : rows.length === 0 ? (
          <EmptyState icon="📭" title="No attempts in this range" />
        ) : (
          <div className="table-wrap border-0 rounded-none">
            <table className="table-base">
              <thead>
                <tr><th>Student</th><th>Test</th><th>Subject</th><th>Marks</th><th>%</th><th>Grade</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.students?.profiles?.full_name} <span className="text-ink-400">({r.students?.student_id})</span></td>
                    <td>{r.tests?.name}</td>
                    <td>{r.tests?.subjects?.name || '—'}</td>
                    <td>{r.obtained_marks}/{r.total_marks}</td>
                    <td>{r.percentage}%</td>
                    <td>{r.grade}</td>
                    <td><span className={r.result_status === 'PASS' ? 'badge-green' : 'badge-red'}>{r.result_status}</span></td>
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
