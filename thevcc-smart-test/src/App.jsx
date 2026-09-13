import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Landing from './pages/Landing';
import AccountLocked from './pages/AccountLocked';
import NotFound from './pages/NotFound';

import StudentLogin from './pages/student/StudentLogin';
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import AvailableTests from './pages/student/AvailableTests';
import Instructions from './pages/student/Instructions';
import Exam from './pages/student/Exam';
import Result from './pages/student/Result';
import TestHistory from './pages/student/TestHistory';
import Performance from './pages/student/Performance';
import ReviewTest from './pages/student/ReviewTest';
import Profile from './pages/student/Profile';

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import StudentDetail from './pages/admin/StudentDetail';
import UserAccess from './pages/admin/UserAccess';
import Subjects from './pages/admin/Subjects';
import Tests from './pages/admin/Tests';
import TestForm from './pages/admin/TestForm';
import AssignTest from './pages/admin/AssignTest';
import Questions from './pages/admin/Questions';
import ResultsAdmin from './pages/admin/Results';
import AttemptDetail from './pages/admin/AttemptDetail';
import Analytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

import { RequireAdmin, RequireStudent } from './components/Guards';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/account-locked" element={<AccountLocked />} />

      {/* Student */}
      <Route path="/login" element={<StudentLogin />} />
      <Route
        path="/student"
        element={
          <RequireStudent>
            <StudentLayout />
          </RequireStudent>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="tests" element={<AvailableTests />} />
        <Route path="history" element={<TestHistory />} />
        <Route path="performance" element={<Performance />} />
        <Route path="profile" element={<Profile />} />
        <Route path="review/:attemptId" element={<ReviewTest />} />
      </Route>
      <Route
        path="/student/instructions/:testId"
        element={
          <RequireStudent>
            <Instructions />
          </RequireStudent>
        }
      />
      <Route
        path="/student/exam/:attemptId"
        element={
          <RequireStudent>
            <Exam />
          </RequireStudent>
        }
      />
      <Route
        path="/student/result/:attemptId"
        element={
          <RequireStudent>
            <Result />
          </RequireStudent>
        }
      />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:studentId" element={<StudentDetail />} />
        <Route path="access" element={<UserAccess />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="tests" element={<Tests />} />
        <Route path="tests/new" element={<TestForm />} />
        <Route path="tests/:testId/edit" element={<TestForm />} />
        <Route path="tests/:testId/questions" element={<Questions />} />
        <Route path="tests/:testId/assign" element={<AssignTest />} />
        <Route path="results" element={<ResultsAdmin />} />
        <Route path="attempts/:attemptId" element={<AttemptDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
