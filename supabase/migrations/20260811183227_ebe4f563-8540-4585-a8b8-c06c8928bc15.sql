-- =========================================================
-- ESCOLA BÍBLICA: catálogo de conteúdo (somente leitura no app)
-- =========================================================

CREATE TYPE public.course_level AS ENUM ('iniciante', 'intermediario', 'avancado', 'profundo');
CREATE TYPE public.access_tier AS ENUM ('free', 'premium');
CREATE TYPE public.lesson_status AS ENUM ('nao_iniciada', 'em_andamento', 'concluida');

CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text NOT NULL DEFAULT '',
  level public.course_level NOT NULL DEFAULT 'iniciante',
  tier public.access_tier NOT NULL DEFAULT 'free',
  cover_url text,
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read published courses" ON public.courses
  FOR SELECT TO authenticated USING (is_published);

CREATE TABLE public.course_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read published modules" ON public.course_modules
  FOR SELECT TO authenticated USING (
    is_published AND EXISTS (
      SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published
    )
  );
CREATE INDEX course_modules_course_idx ON public.course_modules(course_id, order_index);

CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 10,
  tier public.access_tier NOT NULL DEFAULT 'free',
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (module_id, slug)
);
GRANT SELECT ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read published lessons" ON public.lessons
  FOR SELECT TO authenticated USING (
    is_published AND EXISTS (
      SELECT 1 FROM public.course_modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id AND m.is_published AND c.is_published
    )
  );
CREATE INDEX lessons_module_idx ON public.lessons(module_id, order_index);

CREATE TABLE public.lesson_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'texto',
  title text,
  body text NOT NULL DEFAULT '',
  scripture_refs text[] NOT NULL DEFAULT '{}',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lesson_content TO authenticated;
GRANT ALL ON public.lesson_content TO service_role;
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read lesson content" ON public.lesson_content
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.is_published)
  );
CREATE INDEX lesson_content_lesson_idx ON public.lesson_content(lesson_id, order_index);

CREATE TABLE public.lesson_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'video',
  provider text NOT NULL DEFAULT 'url',
  url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer,
  transcript text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lesson_media TO authenticated;
GRANT ALL ON public.lesson_media TO service_role;
ALTER TABLE public.lesson_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read lesson media" ON public.lesson_media
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.is_published)
  );
CREATE INDEX lesson_media_lesson_idx ON public.lesson_media(lesson_id, order_index);

CREATE TABLE public.lesson_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'multipla_escolha',
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer_key text,
  explanation text,
  scripture_refs text[] NOT NULL DEFAULT '{}',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lesson_questions TO authenticated;
GRANT ALL ON public.lesson_questions TO service_role;
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read lesson questions" ON public.lesson_questions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.is_published)
  );
CREATE INDEX lesson_questions_lesson_idx ON public.lesson_questions(lesson_id, order_index);

-- =========================================================
-- PROGRESSO DO ALUNO (dados privados)
-- =========================================================

CREATE TABLE public.lesson_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.lesson_questions(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  response text NOT NULL DEFAULT '',
  is_correct boolean,
  score numeric,
  feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_answers TO authenticated;
GRANT ALL ON public.lesson_answers TO service_role;
ALTER TABLE public.lesson_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lesson answers" ON public.lesson_answers
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  status public.lesson_status NOT NULL DEFAULT 'nao_iniciada',
  notes text NOT NULL DEFAULT '',
  reflection text NOT NULL DEFAULT '',
  seconds_watched integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lesson progress" ON public.lesson_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.course_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_lessons integer NOT NULL DEFAULT 0,
  total_lessons integer NOT NULL DEFAULT 0,
  last_lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_progress TO authenticated;
GRANT ALL ON public.course_progress TO service_role;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own course progress" ON public.course_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  student_name text,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own certificates" ON public.certificates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- ÁREA PREMIUM (estrutura apenas, sem pagamentos)
-- =========================================================

CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  tier public.access_tier NOT NULL DEFAULT 'premium',
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  billing_interval text NOT NULL DEFAULT 'month',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active plans" ON public.subscription_plans
  FOR SELECT TO authenticated USING (is_active);

CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  tier public.access_tier NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'inactive',
  provider text,
  provider_ref text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subscription" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions s
    WHERE s.user_id = _user_id
      AND s.tier = 'premium'
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_premium(uuid) TO authenticated, service_role;

-- Triggers de updated_at reutilizando a função existente
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_content_updated_at BEFORE UPDATE ON public.lesson_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_media_updated_at BEFORE UPDATE ON public.lesson_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_questions_updated_at BEFORE UPDATE ON public.lesson_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_answers_updated_at BEFORE UPDATE ON public.lesson_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_course_progress_updated_at BEFORE UPDATE ON public.course_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();