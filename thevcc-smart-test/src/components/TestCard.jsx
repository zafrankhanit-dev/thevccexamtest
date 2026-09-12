import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TestCard({ test }) {
  const navigate = useNavigate();
  const attempted = test.attempt && test.attempt.status !== 'in_progress';
  const inProgress = test.attempt && test.attempt.status === 'in_progress';

  const handleClick = () => {
    if (attempted) {
      navigate(`/student/result/${test.attempt.id}`);
    } else {
      navigate(`/student/instructions/${test.id}`);
    }
  };

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink-900 truncate">{test.name}</p>
          <p className="text-xs text-ink-500 mt-0.5">
            {test.subject_name || 'General'} {test.class ? `· ${test.class}` : ''} {test.section ? `${test.section}` : ''}
          </p>
        </div>
        {attempted && (
          <span className={test.attempt.result_status === 'PASS' ? 'badge-green' : 'badge-red'}>
            {test.attempt.result_status || 'Submitted'}
          </span>
        )}
        {inProgress && <span className="badge-gray">In progress</span>}
      </div>

      <dl className="grid grid-cols-2 gap-y-2 gap-x-2 mt-4 text-sm">
        <div>
          <dt className="text-ink-400 text-xs">Questions</dt>
          <dd className="font-medium text-ink-800">{test.question_count}</dd>
        </div>
        <div>
          <dt className="text-ink-400 text-xs">Total Marks</dt>
          <dd className="font-medium text-ink-800">{test.total_marks}</dd>
        </div>
        <div>
          <dt className="text-ink-400 text-xs">Duration</dt>
          <dd className="font-medium text-ink-800">{test.duration_minutes} min</dd>
        </div>
        <div>
          <dt className="text-ink-400 text-xs">Passing</dt>
          <dd className="font-medium text-ink-800">{test.passing_percentage}%</dd>
        </div>
      </dl>

      <button onClick={handleClick} className={`mt-5 ${attempted ? 'btn-secondary' : 'btn-primary'} w-full`}>
        {attempted ? 'View Result' : inProgress ? 'Resume Test' : 'Start Test'}
      </button>
    </div>
  );
}
