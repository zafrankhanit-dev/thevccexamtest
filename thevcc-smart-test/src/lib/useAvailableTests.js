import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useAvailableTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: testRows, error: testErr } = await supabase
        .from('tests')
        .select('id, name, subject_id, class, section, duration_minutes, total_marks, passing_percentage, start_date, end_date, subjects(name)')
        .order('created_at', { ascending: false });
      if (testErr) throw testErr;

      const testIds = (testRows || []).map((t) => t.id);

      const [{ data: qCounts }, { data: attempts }] = await Promise.all([
        testIds.length
          ? supabase.from('questions').select('test_id').in('test_id', testIds)
          : Promise.resolve({ data: [] }),
        testIds.length
          ? supabase.from('test_attempts').select('test_id, status, id').in('test_id', testIds)
          : Promise.resolve({ data: [] }),
      ]);

      const countMap = {};
      (qCounts || []).forEach((q) => {
        countMap[q.test_id] = (countMap[q.test_id] || 0) + 1;
      });
      const attemptMap = {};
      (attempts || []).forEach((a) => {
        attemptMap[a.test_id] = a;
      });

      const merged = (testRows || []).map((t) => ({
        ...t,
        subject_name: t.subjects?.name,
        question_count: countMap[t.id] || 0,
        attempt: attemptMap[t.id] || null,
      }));

      setTests(merged);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { tests, loading, error, reload: load };
}
