-- ============================================================================
-- TheVCC Smart Test — Supabase schema
-- Online Examination & Student Performance System for The Vision Coaching Centre
--
-- Run this once in Supabase Studio -> SQL Editor (or via `supabase db push`).
-- Safe to re-run: guarded with IF NOT EXISTS / CREATE OR REPLACE where possible.
--
-- DESIGN NOTES
-- - Students authenticate with Supabase Auth using a synthetic email
--   (e.g. vcc25@students.thevcc.local) mapped to a human-friendly username.
-- - Grading NEVER happens in the browser. Starting an attempt, saving answers,
--   and submitting a test all go through SECURITY DEFINER functions below,
--   which re-check identity, account status, and attempt ownership on every
--   call. Students never get SELECT access to `question_options.is_correct`.
-- - Row Level Security is ON for every table. The anon/authenticated client
--   can only do what the policies below allow — the frontend is not trusted.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. CORE TABLES
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'admin')),
  username text not null unique,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key references public.profiles(id) on delete cascade,
  student_id text not null unique,        -- e.g. VCC25
  class text,
  section text,
  phone text,
  email text,
  status boolean not null default false,  -- ON/OFF access switch (true = ON)
  created_at timestamptz not null default now(),
  last_login timestamptz
);

create index if not exists idx_students_status on public.students(status);
create index if not exists idx_students_class_section on public.students(class, section);

create table if not exists public.user_access_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  changed_by uuid references public.admins(id),
  previous_status boolean,
  new_status boolean not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  class text,
  section text,
  description text,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  total_marks numeric not null default 0,
  passing_percentage numeric not null default 40 check (passing_percentage between 0 and 100),
  negative_marking boolean not null default false,
  negative_marks numeric not null default 0 check (negative_marks >= 0),
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean not null default false,
  created_by uuid references public.admins(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tests_active on public.tests(is_active);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  question_text text not null,
  marks numeric not null default 1 check (marks > 0),
  explanation text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_test on public.questions(test_id, order_index);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_label text not null check (option_label in ('A','B','C','D')),
  option_text text not null,
  is_correct boolean not null default false,
  unique (question_id, option_label)
);

create table if not exists public.test_assignments (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  assignment_type text not null check (assignment_type in ('all','class','section','selected')),
  class text,
  section text,
  student_id uuid references public.students(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_assignments_test on public.test_assignments(test_id);
create index if not exists idx_assignments_student on public.test_assignments(student_id);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','auto_submitted')),
  total_marks numeric,
  obtained_marks numeric,
  percentage numeric,
  grade text,
  result_status text check (result_status in ('PASS','FAIL')),
  total_questions integer,
  attempted_questions integer,
  correct_answers integer,
  wrong_answers integer,
  created_at timestamptz not null default now(),
  unique (test_id, student_id) -- one attempt per student per test — refresh restores it, never duplicates
);

create index if not exists idx_attempts_student on public.test_attempts(student_id);
create index if not exists idx_attempts_test on public.test_attempts(test_id);
create index if not exists idx_attempts_status on public.test_attempts(status);

create table if not exists public.student_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option text check (selected_option in ('A','B','C','D')),
  is_correct boolean,
  marks_obtained numeric,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists idx_answers_attempt on public.student_answers(attempt_id);

create table if not exists public.grade_settings (
  id uuid primary key default gen_random_uuid(),
  grade text not null,
  min_percentage numeric not null,
  max_percentage numeric not null,
  order_index integer not null default 0
);

create table if not exists public.system_settings (
  id integer primary key default 1 check (id = 1), -- single row
  institute_name text not null default 'The Vision Coaching Centre',
  logo_url text,
  theme text not null default 'red',
  default_duration_minutes integer not null default 30,
  default_passing_percentage numeric not null default 40,
  default_negative_marking boolean not null default false,
  default_negative_marks numeric not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (id) values (1) on conflict (id) do nothing;

insert into public.grade_settings (grade, min_percentage, max_percentage, order_index)
select * from (values
  ('A+', 90, 100, 1),
  ('A',  80, 89.99, 2),
  ('B',  70, 79.99, 3),
  ('C',  60, 69.99, 4),
  ('D',  50, 59.99, 5),
  ('F',  0,  49.99, 6)
) as v(grade, min_percentage, max_percentage, order_index)
where not exists (select 1 from public.grade_settings);

-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.id = auth.uid());
$$;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id from public.students s where s.id = auth.uid() and s.status = true;
$$;

create or replace function public.grade_for_percentage(pct numeric)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select grade from public.grade_settings
  where pct >= min_percentage and pct <= max_percentage
  order by order_index
  limit 1;
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tests_updated_at on public.tests;
create trigger trg_tests_updated_at before update on public.tests
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.students enable row level security;
alter table public.user_access_log enable row level security;
alter table public.subjects enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.test_assignments enable row level security;
alter table public.test_attempts enable row level security;
alter table public.student_answers enable row level security;
alter table public.grade_settings enable row level security;
alter table public.system_settings enable row level security;

-- profiles: own row, or admin sees all
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- admins: only admins can see the admin list; a user can read their own admin row
drop policy if exists "admins_select" on public.admins;
create policy "admins_select" on public.admins for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "admins_write" on public.admins;
create policy "admins_write" on public.admins for all
  using (public.is_admin()) with check (public.is_admin());

-- students: student can read own row; admin full access. No student-to-student visibility.
drop policy if exists "students_select_own" on public.students;
create policy "students_select_own" on public.students for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "students_admin_write" on public.students;
create policy "students_admin_write" on public.students for all
  using (public.is_admin()) with check (public.is_admin());

-- user_access_log: admin only
drop policy if exists "access_log_admin_only" on public.user_access_log;
create policy "access_log_admin_only" on public.user_access_log for all
  using (public.is_admin()) with check (public.is_admin());

-- subjects: any authenticated user can read; only admin can write
drop policy if exists "subjects_select" on public.subjects;
create policy "subjects_select" on public.subjects for select
  using (auth.role() = 'authenticated');
drop policy if exists "subjects_admin_write" on public.subjects;
create policy "subjects_admin_write" on public.subjects for all
  using (public.is_admin()) with check (public.is_admin());

-- tests: admin sees/edits everything. Students may SELECT only tests that are
-- active, currently within their date window, and assigned to them.
drop policy if exists "tests_admin_all" on public.tests;
create policy "tests_admin_all" on public.tests for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tests_student_select_eligible" on public.tests;
create policy "tests_student_select_eligible" on public.tests for select
  using (
    public.current_student_id() is not null
    and is_active = true
    and (start_date is null or start_date <= now())
    and (end_date is null or end_date >= now())
    and exists (
      select 1 from public.test_assignments ta
      join public.students s on s.id = public.current_student_id()
      where ta.test_id = tests.id
        and (
          ta.assignment_type = 'all'
          or (ta.assignment_type = 'class' and ta.class = s.class)
          or (ta.assignment_type = 'section' and ta.class = s.class and ta.section = s.section)
          or (ta.assignment_type = 'selected' and ta.student_id = s.id)
        )
    )
  );

-- questions / question_options: admin only, direct. Students NEVER read these
-- tables directly (that would leak correct answers) — they call the
-- get_exam_questions() function below instead, which strips is_correct.
drop policy if exists "questions_admin_all" on public.questions;
create policy "questions_admin_all" on public.questions for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "options_admin_all" on public.question_options;
create policy "options_admin_all" on public.question_options for all
  using (public.is_admin()) with check (public.is_admin());

-- test_assignments: admin manages; a student may see their own eligibility rows
drop policy if exists "assignments_admin_all" on public.test_assignments;
create policy "assignments_admin_all" on public.test_assignments for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "assignments_student_select" on public.test_assignments;
create policy "assignments_student_select" on public.test_assignments for select
  using (
    public.is_admin() or
    assignment_type = 'all' or
    (student_id = auth.uid())
  );

-- test_attempts: student can SELECT their own; all writes for students go
-- through SECURITY DEFINER functions, never direct INSERT/UPDATE.
drop policy if exists "attempts_select_own_or_admin" on public.test_attempts;
create policy "attempts_select_own_or_admin" on public.test_attempts for select
  using (student_id = auth.uid() or public.is_admin());
drop policy if exists "attempts_admin_write" on public.test_attempts;
create policy "attempts_admin_write" on public.test_attempts for all
  using (public.is_admin()) with check (public.is_admin());

-- student_answers: same pattern — read own via attempt ownership, admin all,
-- writes only via functions.
drop policy if exists "answers_select_own_or_admin" on public.student_answers;
create policy "answers_select_own_or_admin" on public.student_answers for select
  using (
    public.is_admin() or
    exists (select 1 from public.test_attempts a where a.id = attempt_id and a.student_id = auth.uid())
  );
drop policy if exists "answers_admin_write" on public.student_answers;
create policy "answers_admin_write" on public.student_answers for all
  using (public.is_admin()) with check (public.is_admin());

-- grade_settings / system_settings: readable by any authenticated user (so
-- students see, e.g., passing % on a test card); writable by admin only.
drop policy if exists "grades_select" on public.grade_settings;
create policy "grades_select" on public.grade_settings for select
  using (auth.role() = 'authenticated');
drop policy if exists "grades_admin_write" on public.grade_settings;
create policy "grades_admin_write" on public.grade_settings for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings_select" on public.system_settings;
create policy "settings_select" on public.system_settings for select
  using (auth.role() = 'authenticated');
drop policy if exists "settings_admin_write" on public.system_settings;
create policy "settings_admin_write" on public.system_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. EXAM ENGINE — SECURITY DEFINER FUNCTIONS
-- All grading and attempt state changes happen here, server-side, so the
-- browser can never fabricate marks, restart a submitted test, or read
-- correct answers ahead of time.
-- ----------------------------------------------------------------------------

-- 4a. Start (or resume) an attempt. Idempotent: refreshing the browser calls
-- this again and gets back the SAME attempt + original started_at, so the
-- timer is derived from a stored server timestamp, never the client clock.
create or replace function public.start_test_attempt(p_test_id uuid)
returns table (
  attempt_id uuid,
  started_at timestamptz,
  duration_minutes integer,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := public.current_student_id();
  v_test record;
  v_existing record;
  v_eligible boolean;
begin
  if v_student_id is null then
    raise exception 'Account is locked or you are not signed in as a student.' using errcode = '28000';
  end if;

  select * into v_test from public.tests where id = p_test_id;
  if not found or v_test.is_active is not true then
    raise exception 'This test is not available.';
  end if;
  if v_test.start_date is not null and v_test.start_date > now() then
    raise exception 'This test has not started yet.';
  end if;
  if v_test.end_date is not null and v_test.end_date < now() then
    raise exception 'This test has expired.';
  end if;

  select exists (
    select 1 from public.test_assignments ta, public.students s
    where s.id = v_student_id and ta.test_id = p_test_id
      and (
        ta.assignment_type = 'all'
        or (ta.assignment_type = 'class' and ta.class = s.class)
        or (ta.assignment_type = 'section' and ta.class = s.class and ta.section = s.section)
        or (ta.assignment_type = 'selected' and ta.student_id = s.id)
      )
  ) into v_eligible;

  if not v_eligible then
    raise exception 'You are not assigned to this test.';
  end if;

  select * into v_existing from public.test_attempts
    where test_id = p_test_id and student_id = v_student_id;

  if found then
    if v_existing.status <> 'in_progress' then
      raise exception 'You have already submitted this test.';
    end if;
    return query select v_existing.id, v_existing.started_at, v_test.duration_minutes, v_existing.status;
    return;
  end if;

  insert into public.test_attempts (test_id, student_id, started_at, status, total_marks, total_questions)
  values (
    p_test_id, v_student_id, now(), 'in_progress', v_test.total_marks,
    (select count(*) from public.questions q where q.test_id = p_test_id)
  )
  returning id, started_at into v_existing;

  return query select v_existing.id, v_existing.started_at, v_test.duration_minutes, 'in_progress'::text;
end;
$$;

-- 4b. Fetch exam questions for an attempt — WITHOUT correct answers.
create or replace function public.get_exam_questions(p_attempt_id uuid)
returns table (
  question_id uuid,
  question_text text,
  marks numeric,
  order_index integer,
  option_label text,
  option_text text,
  selected_option text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt record;
begin
  select * into v_attempt from public.test_attempts where id = p_attempt_id;
  if not found or v_attempt.student_id <> auth.uid() then
    raise exception 'Attempt not found.';
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'This test has already been submitted.';
  end if;

  return query
    select q.id, q.question_text, q.marks, q.order_index,
           o.option_label, o.option_text,
           sa.selected_option
    from public.questions q
    join public.question_options o on o.question_id = q.id
    left join public.student_answers sa on sa.attempt_id = p_attempt_id and sa.question_id = q.id
    where q.test_id = v_attempt.test_id
    order by q.order_index, o.option_label;
end;
$$;

-- 4c. Save/update a single answer (autosave, "Save Answer", Next/Previous).
create or replace function public.save_answer(p_attempt_id uuid, p_question_id uuid, p_selected_option text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt record;
begin
  select * into v_attempt from public.test_attempts where id = p_attempt_id;
  if not found or v_attempt.student_id <> auth.uid() then
    raise exception 'Attempt not found.';
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'This test has already been submitted and cannot be changed.';
  end if;
  if p_selected_option is not null and p_selected_option not in ('A','B','C','D') then
    raise exception 'Invalid option.';
  end if;

  insert into public.student_answers (attempt_id, question_id, selected_option, answered_at)
  values (p_attempt_id, p_question_id, p_selected_option, now())
  on conflict (attempt_id, question_id)
  do update set selected_option = excluded.selected_option, answered_at = now();
end;
$$;

-- 4d. Submit + grade an attempt server-side. Prevents duplicate submission.
create or replace function public.submit_test_attempt(p_attempt_id uuid, p_auto boolean default false)
returns table (
  attempt_id uuid,
  total_questions integer,
  attempted_questions integer,
  correct_answers integer,
  wrong_answers integer,
  total_marks numeric,
  obtained_marks numeric,
  percentage numeric,
  grade text,
  result_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt record;
  v_test record;
  v_total_q integer;
  v_attempted integer;
  v_correct integer;
  v_wrong integer;
  v_obtained numeric := 0;
  v_pct numeric;
  v_grade text;
  v_result text;
  r record;
begin
  select * into v_attempt from public.test_attempts where id = p_attempt_id for update;
  if not found or v_attempt.student_id <> auth.uid() then
    raise exception 'Attempt not found.';
  end if;
  if v_attempt.status <> 'in_progress' then
    -- Already submitted: return the existing (locked) result instead of erroring,
    -- so a duplicate click / retry after a network blip is harmless.
    return query
      select ta.id, ta.total_questions, ta.attempted_questions, ta.correct_answers,
             ta.wrong_answers, ta.total_marks, ta.obtained_marks, ta.percentage,
             ta.grade, ta.result_status
      from public.test_attempts ta where ta.id = p_attempt_id;
    return;
  end if;

  select * into v_test from public.tests where id = v_attempt.test_id;

  select count(*) into v_total_q from public.questions where test_id = v_attempt.test_id;
  v_attempted := 0; v_correct := 0; v_wrong := 0;

  for r in
    select q.id as question_id, q.marks,
           sa.selected_option,
           (select o.option_label from public.question_options o
              where o.question_id = q.id and o.is_correct = true limit 1) as correct_label
    from public.questions q
    left join public.student_answers sa on sa.attempt_id = p_attempt_id and sa.question_id = q.id
    where q.test_id = v_attempt.test_id
  loop
    if r.selected_option is not null then
      v_attempted := v_attempted + 1;
      if r.selected_option = r.correct_label then
        v_correct := v_correct + 1;
        v_obtained := v_obtained + r.marks;
        update public.student_answers set is_correct = true, marks_obtained = r.marks
          where attempt_id = p_attempt_id and question_id = r.question_id;
      else
        v_wrong := v_wrong + 1;
        if v_test.negative_marking then
          v_obtained := v_obtained - v_test.negative_marks;
        end if;
        update public.student_answers set is_correct = false,
          marks_obtained = case when v_test.negative_marking then -v_test.negative_marks else 0 end
          where attempt_id = p_attempt_id and question_id = r.question_id;
      end if;
    end if;
  end loop;

  if v_obtained < 0 then v_obtained := 0; end if;

  v_pct := case when v_test.total_marks > 0 then round((v_obtained / v_test.total_marks) * 100, 2) else 0 end;
  v_grade := public.grade_for_percentage(v_pct);
  v_result := case when v_pct >= v_test.passing_percentage then 'PASS' else 'FAIL' end;

  update public.test_attempts set
    status = case when p_auto then 'auto_submitted' else 'submitted' end,
    submitted_at = now(),
    total_questions = v_total_q,
    attempted_questions = v_attempted,
    correct_answers = v_correct,
    wrong_answers = v_wrong,
    total_marks = v_test.total_marks,
    obtained_marks = v_obtained,
    percentage = v_pct,
    grade = v_grade,
    result_status = v_result
  where id = p_attempt_id;

  return query
    select p_attempt_id, v_total_q, v_attempted, v_correct, v_wrong,
           v_test.total_marks, v_obtained, v_pct, v_grade, v_result;
end;
$$;

-- 4e. Fetch a submitted attempt's full result (for the student's immediate
-- result screen, or the admin audit view).
create or replace function public.get_attempt_result(p_attempt_id uuid)
returns table (
  attempt_id uuid,
  test_name text,
  subject_name text,
  student_name text,
  student_code text,
  started_at timestamptz,
  submitted_at timestamptz,
  total_questions integer,
  attempted_questions integer,
  correct_answers integer,
  wrong_answers integer,
  total_marks numeric,
  obtained_marks numeric,
  percentage numeric,
  grade text,
  result_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt record;
begin
  select * into v_attempt from public.test_attempts where id = p_attempt_id;
  if not found then
    raise exception 'Attempt not found.';
  end if;
  if v_attempt.student_id <> auth.uid() and not public.is_admin() then
    raise exception 'Not authorized.';
  end if;
  if v_attempt.status = 'in_progress' then
    raise exception 'This attempt has not been submitted yet.';
  end if;

  return query
    select ta.id, t.name, sub.name, p.full_name, s.student_id,
           ta.started_at, ta.submitted_at, ta.total_questions, ta.attempted_questions,
           ta.correct_answers, ta.wrong_answers, ta.total_marks, ta.obtained_marks,
           ta.percentage, ta.grade, ta.result_status
    from public.test_attempts ta
    join public.tests t on t.id = ta.test_id
    left join public.subjects sub on sub.id = t.subject_id
    join public.students s on s.id = ta.student_id
    join public.profiles p on p.id = s.id
    where ta.id = p_attempt_id;
end;
$$;

-- 4f. Admin: enable/disable a student, with an audit trail.
create or replace function public.set_student_access(p_student_id uuid, p_status boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev boolean;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;
  select status into v_prev from public.students where id = p_student_id;
  update public.students set status = p_status where id = p_student_id;
  insert into public.user_access_log (student_id, changed_by, previous_status, new_status, note)
  values (p_student_id, auth.uid(), v_prev, p_status, p_note);
end;
$$;

-- 4g. Admin: bulk import questions (already parsed client-side) in one call.
-- Expects a JSON array like:
-- [{"question_text":"...","marks":1,"explanation":"...",
--   "options":[{"label":"A","text":"...","is_correct":false}, ...]}, ...]
create or replace function public.bulk_import_questions(p_test_id uuid, p_questions jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_q jsonb;
  v_opt jsonb;
  v_question_id uuid;
  v_start_index integer;
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select coalesce(max(order_index), 0) into v_start_index from public.questions where test_id = p_test_id;

  for v_q in select * from jsonb_array_elements(p_questions)
  loop
    v_start_index := v_start_index + 1;
    insert into public.questions (test_id, question_text, marks, explanation, order_index)
    values (
      p_test_id,
      v_q->>'question_text',
      coalesce((v_q->>'marks')::numeric, 1),
      v_q->>'explanation',
      v_start_index
    )
    returning id into v_question_id;

    for v_opt in select * from jsonb_array_elements(v_q->'options')
    loop
      insert into public.question_options (question_id, option_label, option_text, is_correct)
      values (
        v_question_id,
        v_opt->>'label',
        v_opt->>'text',
        coalesce((v_opt->>'is_correct')::boolean, false)
      );
    end loop;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. GRANTS
-- Supabase exposes `anon` (pre-login) and `authenticated` (post-login) roles.
-- Table grants are intentionally broad; RLS policies above are the real gate.
-- ----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.subjects, public.grade_settings, public.system_settings to anon;
grant execute on all functions in schema public to authenticated;

-- ============================================================================
-- End of schema. See /supabase/seed_admin_and_students.sql notes in the README
-- for how initial accounts are created via a server-side script (never via
-- frontend code, and never with the service_role key exposed to the browser).
-- ============================================================================
