import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, EmptyState } from '../../components/States';
import { downloadCsv } from '../../lib/csv';

export default function Results() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);

  const [filters, setFilters] = useState({
    search: '', testId: '', subjectId: '', dateFrom: '', dateTo: '', status: '', grade: '',
  });

  const load = async () => {
    setLoading(true);
    const [{ data }, { data: subs }, { data: t }] = await Promise.all([
      supabase
        .from('test_attempts')
        .select('id, submitted_at, percentage, grade, result_status, total_marks, obtained_marks, students(student_id, class, section, profiles(full_name)), tests(id, name, subject_id, subjects(name))')
        .neq('status', 'in_progress')
        .order('submitted_at', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('tests').select('id, name').order('name'),
    ]);
    setRows(data || []);
    setSubjects(subs || []);
    setTests(t || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = `${r.students?.student_id} ${r.students?.profiles?.full_name} ${r.tests?.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.testId && r.tests?.id !== filters.testId) return false;
      if (filters.subjectId && r.tests?.subject_id !== filters.subjectId) return false;
      if (filters.status && r.result_status !== filters.status) return false;
      if (filters.grade && r.grade !== filters.grade) return false;
      if (filters.dateFrom && new Date(r.submitted_at) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(r.submitted_at) > new Date(`${filters.dateTo}T23:59:59`)) return false;
      return true;
    });
  }, [rows, filters]);

  const exportCsv = () => {
    const data = filtered.map((r) => ({
      Student: r.students?.profiles?.full_name,
      'Student ID': r.students?.student_id,
      Test: r.tests?.name,
      Subject: r.tests?.subjects?.name,
      Date: r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '',
      'Total Marks': r.total_marks,
      'Obtained Marks': r.obtained_marks,
      Percentage: r.percentage,
      Grade: r.grade,
      Status: r.result_status,
    }));
    downloadCsv('results.csv', data);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink-950">Results</h1>
          <p className="text-sm text-ink-500 mt-1">All submitted test attempts.</p>
        </div>
        <button className="btn-secondary" onClick={exportCsv}>⬇ Export CSV</button>
      </div>

      <div className="card p-4 mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input className="input" placeholder="Search student or test…" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        <select className="input" value={filters.testId} onChange={(e) => setFilters((f) => ({ ...f, testId: e.target.value }))}>
          <option value="">All Tests</option>
          {tests.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="input" value={filters.subjectId} onChange={(e) => setFilters((f) => ({ ...f, subjectId: e.target.value }))}>
          <option value="">All Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">PASS/FAIL</option>
          <option value="PASS">PASS</option>
          <option value="FAIL">FAIL</option>
        </select>
        <input type="date" className="input" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
        <input type="date" className="input" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
        <select className="input" value={filters.grade} onChange={(e) => setFilters((f) => ({ ...f, grade: e.target.value }))}>
          <option value="">All Grades</option>
          {['A+', 'A', 'B', 'C', 'D', 'F'].map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="card mt-4">
        {loading ? (
          <PageLoading />
        ) : filtered.length === 0 ? (
          <EmptyState icon="✅" title="No results match your filters" />
        ) : (
          <div className="table-wrap border-0 rounded-none">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Test</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Marks</th>
                  <th>%</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.students?.profiles?.full_name}</td>
                    <td>{r.students?.student_id}</td>
                    <td>{r.tests?.name}</td>
                    <td>{r.tests?.subjects?.name || '—'}</td>
                    <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                    <td>{r.obtained_marks}/{r.total_marks}</td>
                    <td>{r.percentage}%</td>
                    <td>{r.grade}</td>
                    <td><span className={r.result_status === 'PASS' ? 'badge-green' : 'badge-red'}>{r.result_status}</span></td>
                    <td><Link to={`/admin/attempts/${r.id}`} className="text-brand-700 text-sm font-medium hover:underline">View</Link></td>
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
