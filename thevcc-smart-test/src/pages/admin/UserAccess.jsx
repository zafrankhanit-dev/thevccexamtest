import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { PageLoading, EmptyState } from '../../components/States';

export default function UserAccess() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | on | off
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('id, student_id, status, profiles(full_name)')
      .order('student_id');
    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = students;
    if (filter === 'on') list = list.filter((s) => s.status);
    if (filter === 'off') list = list.filter((s) => !s.status);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) => s.student_id.toLowerCase().includes(q) || (s.profiles?.full_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, query, filter]);

  const toggleOne = async (student, next) => {
    const { error } = await supabase.rpc('set_student_access', { p_student_id: student.id, p_status: next });
    if (error) {
      toast.error(error.message);
      return;
    }
    setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, status: next } : s)));
    toast.success(`${student.student_id} is now ${next ? 'ON' : 'OFF'}.`);
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkSet = async (status) => {
    if (selected.size === 0) return;
    await Promise.all(
      Array.from(selected).map((id) => supabase.rpc('set_student_access', { p_student_id: id, p_status: status }))
    );
    toast.success(`${selected.size} account(s) set to ${status ? 'ON' : 'OFF'}.`);
    setSelected(new Set());
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink-950">User Access</h1>
          <p className="text-sm text-ink-500 mt-1">Enable or disable student portal access.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <input className="input max-w-xs" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="input max-w-[140px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="on">ON only</option>
            <option value="off">OFF only</option>
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 text-sm">
          <span className="font-medium text-brand-800">{selected.size} selected</span>
          <button className="btn-secondary py-1.5" onClick={() => bulkSet(true)}>Enable selected</button>
          <button className="btn-secondary py-1.5" onClick={() => bulkSet(false)}>Disable selected</button>
          <button className="btn-ghost py-1.5" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="card mt-4">
        {loading ? (
          <PageLoading />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔐" title="No users found" />
        ) : (
          <div className="table-wrap border-0 rounded-none">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every((s) => selected.has(s.id))}
                      onChange={(e) =>
                        setSelected(e.target.checked ? new Set(filtered.map((s) => s.id)) : new Set())
                      }
                    />
                  </th>
                  <th>Username</th>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelected(s.id)} />
                    </td>
                    <td className="font-medium">{s.student_id}</td>
                    <td>{s.profiles?.full_name}</td>
                    <td><span className={s.status ? 'badge-green' : 'badge-red'}>{s.status ? 'ON' : 'OFF'}</span></td>
                    <td>
                      <button
                        className={s.status ? 'btn-danger py-1.5' : 'btn-secondary py-1.5'}
                        onClick={() => toggleOne(s, !s.status)}
                      >
                        {s.status ? 'Disable' : 'Enable'}
                      </button>
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
