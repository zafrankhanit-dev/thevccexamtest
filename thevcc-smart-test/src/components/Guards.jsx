import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoading } from './States';

export function RequireAdmin({ children }) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoading label="Checking your session…" />;
  if (!session) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (role !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
}

export function RequireStudent({ children }) {
  const { session, role, loading, studentRow } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoading label="Checking your session…" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role !== 'student') return <Navigate to="/login" replace />;
  // Defense in depth: even if a session lingers, an OFF account is bounced.
  // The database (RLS + RPC checks) enforces this independently as well.
  if (studentRow && studentRow.status !== true) return <Navigate to="/account-locked" replace />;
  return children;
}
