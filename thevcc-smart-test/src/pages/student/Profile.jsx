import React from 'react';
import { User, Hash, GraduationCap, BookOpen, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function Row({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-ink-100 last:border-0">
      <div className="h-9 w-9 rounded-lg bg-ink-100 text-ink-600 flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-sm font-medium text-ink-900">{value}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { profile, studentRow } = useAuth();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-ink-950">Profile</h1>
      <p className="text-sm text-ink-500 mt-1">Your account information.</p>

      <div className="card p-6 mt-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-14 w-14 rounded-full bg-brand-700 text-white flex items-center justify-center text-lg font-semibold">
            {profile?.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <p className="font-semibold text-ink-950">{profile?.full_name}</p>
            <p className="text-sm text-ink-500">{studentRow?.student_id}</p>
          </div>
        </div>

        <div className="mt-2">
          <Row icon={User} label="Name" value={profile?.full_name} />
          <Row icon={Hash} label="Student ID" value={studentRow?.student_id} />
          <Row icon={GraduationCap} label="Class" value={studentRow?.class} />
          <Row icon={BookOpen} label="Section" value={studentRow?.section} />
          <Row icon={Phone} label="Phone" value={studentRow?.phone} />
          <Row icon={Mail} label="Email" value={studentRow?.email} />
        </div>
      </div>
    </div>
  );
}
