-- Add indexes for foreign-key columns identified by Supabase's performance advisor.
-- These are additive, non-unique indexes; existing data and constraints are unchanged.

create index if not exists idx_certificates_course_id
  on public.certificates (course_id);

create index if not exists idx_course_progress_course_id
  on public.course_progress (course_id);

create index if not exists idx_course_progress_last_lesson_id
  on public.course_progress (last_lesson_id);

create index if not exists idx_exercise_submissions_exercise_id
  on public.exercise_submissions (exercise_id);

create index if not exists idx_exercise_submissions_lesson_id
  on public.exercise_submissions (lesson_id);

create index if not exists idx_lesson_answers_lesson_id
  on public.lesson_answers (lesson_id);

create index if not exists idx_lesson_answers_question_id
  on public.lesson_answers (question_id);

create index if not exists idx_lesson_exercises_lesson_id
  on public.lesson_exercises (lesson_id);

create index if not exists idx_lesson_progress_course_id
  on public.lesson_progress (course_id);

create index if not exists idx_lesson_progress_lesson_id
  on public.lesson_progress (lesson_id);

create index if not exists idx_lesson_reflections_lesson_id
  on public.lesson_reflections (lesson_id);

create index if not exists idx_sermon_messages_course_id
  on public.sermon_messages (course_id);

create index if not exists idx_user_subscriptions_plan_id
  on public.user_subscriptions (plan_id);
