-- ============================================================================
-- TheVCC Smart Test — v2 migration: student self-history & performance
--
-- POLICY CHANGE FROM v1: students may now view their OWN full test history,
-- their own past question-by-question review (with correct answers, only for
-- attempts they have already submitted), and their own performance summary.
-- Students still cannot see other students' data, cannot see correct answers
-- before submitting, and cannot modify anything — everything below is
-- SECURITY DEFINER + explicitly scoped to auth.uid().
--
-- Run this in Supabase SQL Editor after the original schema.sql.
-- ============================================================================

-- 1. Full test history for the currently signed-in student (all submitted
--    attempts, most recent first). Bypasses the "active test" RLS on `tests`
--    intentionally — a completed test may since have been deactivated, but
--    the student who took it should still see it in their history.
create or replace function public.get_student_test_history()
returns table (
  attempt_id uuid,
  test_id uuid,
  test_name text,
  subject_name text,
  class text,
  section text,
  started_at timestamptz,
  submitted_at timestamptz,
  duration_minutes integer,
  total_questions integer,
  attempted_questions integer,
  correct_answers integer,
  wrong_answers integer,
  total_marks numeric,
  obtained_marks numeric,
  percentage numeric,
  grade text,
  result_status text,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ta.id, t.id, t.name, sub.name, t.class, t.section,
    ta.started_at, ta.submitted_at, t.duration_minutes,
    ta.total_questions, ta.attempted_questions, ta.correct_answers, ta.wrong_answers,
    ta.total_marks, ta.obtained_marks, ta.percentage, ta.grade, ta.result_status, ta.status
  from public.test_attempts ta
  join public.tests t on t.id = ta.test_id
  left join public.subjects sub on sub.id = t.subject_id
  where ta.student_id = auth.uid()
    and ta.status <> 'in_progress'
  order by ta.submitted_at desc nulls last;
$$;

-- 2. Question-by-question review of the student's OWN submitted attempt,
--    including correct answers — safe only because the attempt is already
--    locked (status <> 'in_progress'), so nothing can be changed after
--    seeing this.
create or replace function public.get_student_attempt_review(p_attempt_id uuid)
returns table (
  question_id uuid,
  question_text text,
  marks numeric,
  order_index integer,
  option_label text,
  option_text text,
  is_correct_option boolean,
  selected_option text,
  was_correct boolean,
  marks_obtained numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt record;
begin
  select * into v_attempt from public.test_attempts ta where ta.id = p_attempt_id;
  if not found or v_attempt.student_id <> auth.uid() then
    raise exception 'Attempt not found.';
  end if;
  if v_attempt.status = 'in_progress' then
    raise exception 'This test has not been submitted yet.';
  end if;

  return query
    select q.id, q.question_text, q.marks, q.order_index,
           o.option_label, o.option_text, o.is_correct,
           sa.selected_option, sa.is_correct, sa.marks_obtained
    from public.questions q
    join public.question_options o on o.question_id = q.id
    left join public.student_answers sa on sa.attempt_id = p_attempt_id and sa.question_id = q.id
    where q.test_id = v_attempt.test_id
    order by q.order_index, o.option_label;
end;
$$;

-- 3. Aggregate performance summary for the currently signed-in student.
create or replace function public.get_student_performance()
returns table (
  total_tests integer,
  average_percentage numeric,
  best_percentage numeric,
  total_correct integer,
  total_wrong integer,
  total_unattempted integer,
  pass_count integer,
  fail_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::integer,
    coalesce(round(avg(ta.percentage), 1), 0),
    coalesce(max(ta.percentage), 0),
    coalesce(sum(ta.correct_answers), 0)::integer,
    coalesce(sum(ta.wrong_answers), 0)::integer,
    coalesce(sum(ta.total_questions - ta.attempted_questions), 0)::integer,
    coalesce(sum(case when ta.result_status = 'PASS' then 1 else 0 end), 0)::integer,
    coalesce(sum(case when ta.result_status = 'FAIL' then 1 else 0 end), 0)::integer
  from public.test_attempts ta
  where ta.student_id = auth.uid()
    and ta.status <> 'in_progress';
$$;

grant execute on function public.get_student_test_history() to authenticated;
grant execute on function public.get_student_attempt_review(uuid) to authenticated;
grant execute on function public.get_student_performance() to authenticated;
