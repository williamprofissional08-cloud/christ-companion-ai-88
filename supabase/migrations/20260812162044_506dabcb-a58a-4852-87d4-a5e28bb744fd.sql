-- 1) PAPÉIS
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin());

-- 2) ADMIN PRINCIPAL (sem senha, sem criar conta)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) = 'william.profissional08@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_bootstrap_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'william.profissional08@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_bootstrap_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_bootstrap_admin();

-- 3) STATUS DE PUBLICAÇÃO
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');

ALTER TABLE public.courses
  ADD COLUMN status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN published_at timestamptz;
ALTER TABLE public.course_modules
  ADD COLUMN status public.content_status NOT NULL DEFAULT 'draft';
ALTER TABLE public.lessons
  ADD COLUMN status public.content_status NOT NULL DEFAULT 'draft';

UPDATE public.courses SET status = 'published', published_at = COALESCE(published_at, now()) WHERE is_published;
UPDATE public.course_modules SET status = 'published' WHERE is_published;
UPDATE public.lessons SET status = 'published' WHERE is_published;

CREATE OR REPLACE FUNCTION public.sync_publish_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.is_published := (NEW.status = 'published'::public.content_status);
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_courses_status BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.sync_publish_status();
CREATE TRIGGER sync_course_modules_status BEFORE INSERT OR UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.sync_publish_status();
CREATE TRIGGER sync_lessons_status BEFORE INSERT OR UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.sync_publish_status();

-- 4) POLÍTICAS DE ADMIN (aditivas)
CREATE POLICY "admins manage courses" ON public.courses
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins manage modules" ON public.course_modules
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins manage lessons" ON public.lessons
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins manage lesson content" ON public.lesson_content
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins manage lesson questions" ON public.lesson_questions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins manage lesson media" ON public.lesson_media
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_media TO authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.course_modules TO service_role;
GRANT ALL ON public.lessons TO service_role;
GRANT ALL ON public.lesson_content TO service_role;
GRANT ALL ON public.lesson_questions TO service_role;
GRANT ALL ON public.lesson_media TO service_role;

-- admins também precisam ler rascunhos
CREATE POLICY "admins read progress overview" ON public.course_progress
  FOR SELECT TO authenticated USING (public.is_admin());

-- 5) PRIMEIRO CURSO (rascunho)
INSERT INTO public.courses (slug, title, subtitle, description, level, tier, order_index, status)
VALUES (
  'como-estudar-a-biblia',
  'Como Estudar a Bíblia',
  'Aprenda a ler, observar, compreender e aplicar as Escrituras de maneira simples, profunda e responsável.',
  'Uma jornada de fundamentos para desenvolver uma leitura bíblica mais consciente, contextualizada e responsável, aprendendo a observar o texto, compreender seu contexto e aplicar suas verdades à vida cristã.',
  'iniciante', 'free', 1, 'draft'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.course_modules (course_id, title, summary, order_index, status)
SELECT c.id, m.title, m.summary, m.ord, 'draft'::public.content_status
FROM public.courses c
CROSS JOIN (VALUES
  ('Fundamentos do Estudo Bíblico', 'Por que e como estudar a Bíblia com reverência e método.', 1),
  ('Como Observar um Texto Bíblico', 'Aprender a olhar o texto com atenção antes de interpretar.', 2),
  ('Contexto Bíblico', 'Contexto histórico, cultural e literário das Escrituras.', 3),
  ('Interpretação', 'Princípios responsáveis de interpretação da Palavra.', 4),
  ('Aplicação', 'Como levar o texto bíblico à vida prática.', 5)
) AS m(title, summary, ord)
WHERE c.slug = 'como-estudar-a-biblia'
  AND NOT EXISTS (SELECT 1 FROM public.course_modules cm WHERE cm.course_id = c.id);