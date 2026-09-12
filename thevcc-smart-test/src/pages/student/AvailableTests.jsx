import React, { useState, useMemo } from 'react';
import { useAvailableTests } from '../../lib/useAvailableTests';
import { PageLoading, EmptyState, ErrorState } from '../../components/States';
import TestCard from '../../components/TestCard';

export default function AvailableTests() {
  const { tests, loading, error, reload } = useAvailableTests();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return tests;
    const q = query.toLowerCase();
    return tests.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.subject_name || '').toLowerCase().includes(q)
    );
  }, [tests, query]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink-950">Available Tests</h1>
          <p className="text-sm text-ink-500 mt-1">All tests assigned to you.</p>
        </div>
        <input
          className="input max-w-xs"
          placeholder="Search by test or subject…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-6">
        {loading && <PageLoading label="Loading your tests…" />}
        {!loading && error && <ErrorState description="Could not load tests." onRetry={reload} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState icon="🔎" title="No tests found" description="Try a different search term." />
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TestCard key={t.id} test={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
