-- 1. Metadados de módulo (livro x formação) e etapa de publicação
ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS module_kind text NOT NULL DEFAULT 'livro',
  ADD COLUMN IF NOT EXISTS phase integer;

ALTER TABLE public.course_modules
  ADD CONSTRAINT course_modules_module_kind_check
  CHECK (module_kind IN ('livro', 'formacao'));

-- 2. Capítulos canônicos de cada livro
CREATE TABLE public.book_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL CHECK (chapter_number > 0),
  title text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  total_verses integer CHECK (total_verses IS NULL OR total_verses > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, chapter_number)
);
GRANT SELECT ON public.book_chapters TO authenticated;
GRANT ALL ON public.book_chapters TO service_role;
ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read chapters of published books" ON public.book_chapters
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = book_chapters.module_id AND m.is_published AND c.is_published
  ));
CREATE POLICY "admins manage chapters" ON public.book_chapters
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX book_chapters_module_idx ON public.book_chapters (module_id, chapter_number);
CREATE TRIGGER update_book_chapters_updated_at
  BEFORE UPDATE ON public.book_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Vínculo do estudo com capítulo e faixa de versículos
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES public.book_chapters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verse_start integer CHECK (verse_start IS NULL OR verse_start > 0),
  ADD COLUMN IF NOT EXISTS verse_end integer CHECK (verse_end IS NULL OR verse_end > 0);
CREATE INDEX IF NOT EXISTS lessons_chapter_idx ON public.lessons (chapter_id, verse_start);

-- 4. Introdução completa do livro
CREATE TABLE public.book_introductions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL UNIQUE REFERENCES public.course_modules(id) ON DELETE CASCADE,
  name_meaning text NOT NULL DEFAULT '',
  original_name text NOT NULL DEFAULT '',
  authorship text NOT NULL DEFAULT '',
  dating text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT '',
  purpose text NOT NULL DEFAULT '',
  historical_context text NOT NULL DEFAULT '',
  cultural_context text NOT NULL DEFAULT '',
  geography text NOT NULL DEFAULT '',
  main_characters text NOT NULL DEFAULT '',
  central_theme text NOT NULL DEFAULT '',
  structure text NOT NULL DEFAULT '',
  canon_relation text NOT NULL DEFAULT '',
  christ_connection text NOT NULL DEFAULT '',
  academic_notes text NOT NULL DEFAULT '',
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.book_introductions TO authenticated;
GRANT ALL ON public.book_introductions TO service_role;
ALTER TABLE public.book_introductions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read published book introductions" ON public.book_introductions
  FOR SELECT TO authenticated
  USING (status = 'published' AND EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = book_introductions.module_id AND m.is_published AND c.is_published
  ));
CREATE POLICY "admins manage book introductions" ON public.book_introductions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER update_book_introductions_updated_at
  BEFORE UPDATE ON public.book_introductions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Referências cruzadas explicadas
CREATE TABLE public.lesson_cross_references (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  reference text NOT NULL,
  relation_kind text NOT NULL DEFAULT 'tema',
  explanation text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_cross_references
  ADD CONSTRAINT lesson_cross_references_relation_kind_check
  CHECK (relation_kind IN ('antigo_testamento','novo_testamento','profecia','cumprimento','tipologia','citacao','tema'));
GRANT SELECT ON public.lesson_cross_references TO authenticated;
GRANT ALL ON public.lesson_cross_references TO service_role;
ALTER TABLE public.lesson_cross_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read cross references of published lessons" ON public.lesson_cross_references
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_cross_references.lesson_id AND l.is_published));
CREATE POLICY "admins manage cross references" ON public.lesson_cross_references
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX lesson_cross_references_lesson_idx ON public.lesson_cross_references (lesson_id, order_index);
CREATE TRIGGER update_lesson_cross_references_updated_at
  BEFORE UPDATE ON public.lesson_cross_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Glossário bíblico e dicionário cultural
CREATE TABLE public.glossary_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  term text NOT NULL,
  kind text NOT NULL DEFAULT 'glossario',
  original_term text NOT NULL DEFAULT '',
  transliteration text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT '',
  definition text NOT NULL DEFAULT '',
  contextual_note text NOT NULL DEFAULT '',
  scripture_refs text[] NOT NULL DEFAULT '{}',
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.glossary_terms
  ADD CONSTRAINT glossary_terms_kind_check CHECK (kind IN ('glossario','cultura'));
GRANT SELECT ON public.glossary_terms TO authenticated;
GRANT ALL ON public.glossary_terms TO service_role;
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read published glossary" ON public.glossary_terms
  FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "admins manage glossary" ON public.glossary_terms
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX glossary_terms_kind_term_idx ON public.glossary_terms (kind, term);
CREATE TRIGGER update_glossary_terms_updated_at
  BEFORE UPDATE ON public.glossary_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lesson_glossary_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, term_id)
);
GRANT SELECT ON public.lesson_glossary_terms TO authenticated;
GRANT ALL ON public.lesson_glossary_terms TO service_role;
ALTER TABLE public.lesson_glossary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read glossary links of published lessons" ON public.lesson_glossary_terms
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_glossary_terms.lesson_id AND l.is_published));
CREATE POLICY "admins manage glossary links" ON public.lesson_glossary_terms
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX lesson_glossary_terms_lesson_idx ON public.lesson_glossary_terms (lesson_id, order_index);

-- 7. Fontes editoriais
CREATE TABLE public.content_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'referencia',
  title text NOT NULL,
  author text NOT NULL DEFAULT '',
  detail text NOT NULL DEFAULT '',
  url text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (lesson_id IS NOT NULL OR module_id IS NOT NULL)
);
GRANT SELECT ON public.content_sources TO authenticated;
GRANT ALL ON public.content_sources TO service_role;
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read sources of published content" ON public.content_sources
  FOR SELECT TO authenticated
  USING (
    (lesson_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = content_sources.lesson_id AND l.is_published))
    OR (module_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = content_sources.module_id AND m.is_published AND c.is_published
    ))
  );
CREATE POLICY "admins manage sources" ON public.content_sources
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX content_sources_lesson_idx ON public.content_sources (lesson_id, order_index);
CREATE INDEX content_sources_module_idx ON public.content_sources (module_id, order_index);
CREATE TRIGGER update_content_sources_updated_at
  BEFORE UPDATE ON public.content_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Exercícios do estudo e respostas privadas do aluno
CREATE TABLE public.lesson_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'reflexao',
  title text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_exercises
  ADD CONSTRAINT lesson_exercises_kind_check CHECK (kind IN ('reflexao','observacao','esboco','pregacao','aplicacao'));
GRANT SELECT ON public.lesson_exercises TO authenticated;
GRANT ALL ON public.lesson_exercises TO service_role;
ALTER TABLE public.lesson_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read published exercises" ON public.lesson_exercises
  FOR SELECT TO authenticated
  USING (status = 'published' AND EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_exercises.lesson_id AND l.is_published));
CREATE POLICY "admins manage exercises" ON public.lesson_exercises
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX lesson_exercises_lesson_idx ON public.lesson_exercises (lesson_id, order_index);
CREATE TRIGGER update_lesson_exercises_updated_at
  BEFORE UPDATE ON public.lesson_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.exercise_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.lesson_exercises(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_submissions TO authenticated;
GRANT ALL ON public.exercise_submissions TO service_role;
ALTER TABLE public.exercise_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exercise submissions" ON public.exercise_submissions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX exercise_submissions_user_lesson_idx ON public.exercise_submissions (user_id, lesson_id);
CREATE TRIGGER update_exercise_submissions_updated_at
  BEFORE UPDATE ON public.exercise_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Índices de navegação e busca em grande volume
CREATE INDEX IF NOT EXISTS course_modules_kind_phase_idx ON public.course_modules (course_id, module_kind, phase, book_number);
CREATE INDEX IF NOT EXISTS lessons_passage_idx ON public.lessons (module_id, passage);