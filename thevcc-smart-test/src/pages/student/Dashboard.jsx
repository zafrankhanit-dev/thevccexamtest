import React from 'react';
import { useAvailableTests } from '../../lib/useAvailableTests';
import { PageLoading, EmptyState, ErrorState } from '../../components/States';
import TestCard from '../../components/TestCard';

export default function StudentDashboard() {
  const { tests, loading, error, reload } = useAvailableTests();

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-950">Dashboard</h1>
      <p className="text-sm text-ink-500 mt-1">Tests currently available to you.</p>

      <div className="mt-6">
        {loading && <PageLoading label="Loading your tests…" />}
        {!loading && error && <ErrorState description="Could not load tests." onRetry={reload} />}
        {!loading && !error && tests.length === 0 && (
          <EmptyState
            icon="📭"
            title="No tests available right now"
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
    </div>
  );
}
