import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { changeOwnUsername, changeOwnPassword } from '../../lib/adminActions';
import { signOut } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';
import { PageLoading, Spinner } from '../../components/States';

function SectionCard({ title, children }) {
  return (
    <div className="card p-6">
      <h2 className="font-semibold text-ink-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function Settings() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [savingUsername, setSavingUsername] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [settings, setSettings] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: s }, { data: g }] = await Promise.all([
        supabase.from('system_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('grade_settings').select('*').order('order_index'),
      ]);
      setSettings(s);
      setGrades(g || []);
      setLoading(false);
    })();
  }, []);

  const handleUsernameSave = async (e) => {
    e.preventDefault();
    setSavingUsername(true);
    try {
      await changeOwnUsername(newUsername);
      toast.success('Admin credentials updated successfully.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingUsername(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setSavingPw(true);
    try {
      await changeOwnPassword(currentPw, newPw);
      toast.success('Admin credentials updated successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      toast('Please sign in again with your new password.', { icon: '🔒' });
      await signOut();
      navigate('/admin/login', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const { error } = await supabase.from('system_settings').update(settings).eq('id', 1);
    setSavingSettings(false);
    if (error) toast.error(error.message);
    else toast.success('Settings saved.');
  };

  const updateGrade = (id, field, value) => {
    setGrades((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const saveGrades = async () => {
    setSavingGrades(true);
    for (const g of grades) {
      await supabase.from('grade_settings').update({
        grade: g.grade,
        min_percentage: Number(g.min_percentage),
        max_percentage: Number(g.max_percentage),
      }).eq('id', g.id);
    }
    setSavingGrades(false);
    toast.success('Grading system updated.');
  };

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-bold text-ink-950">Settings</h1>

      <SectionCard title="Admin Account — Change Username">
        <form onSubmit={handleUsernameSave} className="space-y-3 max-w-sm">
          <div>
            <label className="label">Current Username</label>
            <input className="input" disabled value={profile?.username || ''} />
          </div>
          <div>
            <label className="label">New Username</label>
            <input className="input" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={savingUsername}>{savingUsername ? <Spinner /> : 'Save Username'}</button>
        </form>
      </SectionCard>

      <SectionCard title="Admin Account — Change Password">
        <form onSubmit={handlePasswordSave} className="space-y-3 max-w-sm">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={savingPw}>{savingPw ? <Spinner /> : 'Change Password'}</button>
        </form>
      </SectionCard>

      <SectionCard title="Examination Defaults">
        <form onSubmit={handleSettingsSave} className="grid sm:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="label">Default Duration (minutes)</label>
            <input type="number" className="input" value={settings.default_duration_minutes}
              onChange={(e) => setSettings((s) => ({ ...s, default_duration_minutes: e.target.value }))} />
          </div>
          <div>
            <label className="label">Default Passing %</label>
            <input type="number" className="input" value={settings.default_passing_percentage}
              onChange={(e) => setSettings((s) => ({ ...s, default_passing_percentage: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
            <input type="checkbox" checked={settings.default_negative_marking}
              onChange={(e) => setSettings((s) => ({ ...s, default_negative_marking: e.target.checked }))} />
            Negative Marking (default)
          </label>
          <div>
            <label className="label">Default Negative Marks</label>
            <input type="number" step="0.05" className="input" value={settings.default_negative_marks}
              onChange={(e) => setSettings((s) => ({ ...s, default_negative_marks: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={savingSettings}>{savingSettings ? <Spinner /> : 'Save Examination Settings'}</button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Grading System">
        <div className="space-y-2">
          {grades.map((g) => (
            <div key={g.id} className="grid grid-cols-3 gap-3 items-center">
              <input className="input" value={g.grade} onChange={(e) => updateGrade(g.id, 'grade', e.target.value)} />
              <input type="number" className="input" value={g.min_percentage} onChange={(e) => updateGrade(g.id, 'min_percentage', e.target.value)} placeholder="Min %" />
              <input type="number" className="input" value={g.max_percentage} onChange={(e) => updateGrade(g.id, 'max_percentage', e.target.value)} placeholder="Max %" />
            </div>
          ))}
          <button className="btn-primary mt-2" onClick={saveGrades} disabled={savingGrades}>{savingGrades ? <Spinner /> : 'Save Grading System'}</button>
        </div>
      </SectionCard>

      <SectionCard title="Branding">
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="label">Institute Name</label>
            <input className="input" value={settings.institute_name} onChange={(e) => setSettings((s) => ({ ...s, institute_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Theme</label>
            <input className="input" disabled value="Professional Red" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Logo</label>
            <p className="text-sm text-ink-500">
              Replace <code className="bg-ink-100 px-1.5 py-0.5 rounded text-xs">src/components/Logo.jsx</code> with your own logo image — see the comment inside that file.
            </p>
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" onClick={handleSettingsSave} disabled={savingSettings}>{savingSettings ? <Spinner /> : 'Save Branding'}</button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
