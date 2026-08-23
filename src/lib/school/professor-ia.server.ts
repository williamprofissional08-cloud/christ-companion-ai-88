/**
 * Professor IA — contexto da aula e prompt de sistema (somente servidor).
 * Reutiliza o gateway e as regras bíblicas já existentes do aplicativo.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { BIBLICAL_SYSTEM_PROMPT, REFERENCE_RULE } from "@/lib/ai-gateway.server";


type Client = SupabaseClient<Database>;

export type LessonContext = {
  courseTitle: string;
  courseLevel: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonSummary: string;
  blocks: { title: string; body: string; refs: string[] }[];
  questions: string[];
};

/**
 * Carrega o contexto da aula respeitando RLS (somente conteúdo publicado)
 * e o sistema de acesso Free/Premium já existente.
 * Retorna null quando a aula não está acessível para o aluno.
 */
export async function loadLessonContext(
  supabase: Client,
  userId: string,
  lessonId: string,
): Promise<LessonContext | null> {
  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "id, title, summary, tier, course_modules!inner(title, courses!inner(title, level, tier))",
    )
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return null;

  const moduleRow = lesson.course_modules as unknown as {
    title: string;
    courses: { title: string; level: string; tier: string };
  };
  const course = moduleRow.courses;

  // Professor IA é gratuito para qualquer usuário autenticado: sem trava de assinatura.


  const [{ data: blocks }, { data: questions }] = await Promise.all([
    supabase
      .from("lesson_content")
      .select("kind, title, body, scripture_refs, order_index")
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true }),
    supabase
      .from("lesson_questions")
      .select("prompt, order_index")
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true }),
  ]);

  return {
    courseTitle: course.title,
    courseLevel: course.level,
    moduleTitle: moduleRow.title,
    lessonTitle: lesson.title,
    lessonSummary: lesson.summary ?? "",
    blocks: (blocks ?? []).map((b) => ({
      title: b.title ?? b.kind,
      body: b.body,
      refs: b.scripture_refs ?? [],
    })),
    questions: (questions ?? []).map((q) => q.prompt),
  };
}

const PROFESSOR_PERSONA = `PAPEL: Você é o "Professor IA" da Escola Bíblica do aplicativo "Caminhando com Cristo". Você é um professor auxiliar da AULA que o aluno está estudando agora.

TOM: acolhedor, respeitoso, didático, paciente e simples. Sem linguagem acadêmica desnecessária e sem tratar o aluno com superioridade.

REGRA "SIMPLES PRIMEIRO, PROFUNDO DEPOIS":
- Comece com uma explicação simples e curta (2 a 5 parágrafos curtos, use listas quando ajudar).
- Ao final, ofereça aprofundamento com uma pergunta breve (ex.: "Quer que eu aprofunde este ponto com uma passagem bíblica?").
- Só aprofunde de imediato quando o aluno pedir para aprofundar.

ESCOPO:
- Responda principalmente com base no CONTEÚDO DA AULA fornecido abaixo e nas Escrituras relacionadas.
- Se a pergunta fugir da aula, responda com brevidade e reconduza gentilmente ao estudo.
- Ajude o aluno a compreender a aula, termos difíceis, contexto, exemplos simples, revisão dos pontos principais e aplicação prática.
- Quando o aluno pedir questionário, faça perguntas para testar o aprendizado (sem entregar todas as respostas de imediato).

LIMITES (deixe claro quando for pertinente):
- "Sou um auxiliar de estudo e não substituo a Bíblia, a oração, a comunidade cristã ou o acompanhamento pastoral."
- Nunca diga que recebeu revelação de Deus, nunca fale como se fosse Deus, nunca invente versículos, doutrinas ou revelações, e nunca apresente opinião pessoal como verdade bíblica.
- Em situações que exijam acompanhamento pastoral ou profissional, oriente com amor a buscar essa ajuda.
- Quando houver divergência interpretativa entre tradições cristãs, diga isso de forma equilibrada.`;

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Monta o prompt de sistema do Professor IA reutilizando as regras bíblicas do app. */
export function buildProfessorSystemPrompt(context: LessonContext): string {
  const blocks = context.blocks
    .map((b) => {
      const refs = b.refs.length ? `\nReferências: ${b.refs.join("; ")}` : "";
      return `### ${b.title}\n${truncate(b.body, 3500)}${refs}`;
    })
    .join("\n\n");

  const questions = context.questions.length
    ? `\n\nPERGUNTAS DA AULA:\n- ${context.questions.join("\n- ")}`
    : "";

  return `${BIBLICAL_SYSTEM_PROMPT}

${REFERENCE_RULE}

${PROFESSOR_PERSONA}

==================================================
CONTEXTO DA AULA ATUAL
==================================================
Curso: ${context.courseTitle} (nível: ${context.courseLevel})
Módulo: ${context.moduleTitle}
Aula: ${context.lessonTitle}
Descrição: ${context.lessonSummary}

CONTEÚDO DA AULA:
${blocks || "(conteúdo desta aula ainda não publicado — responda com base no título e na descrição)"}${questions}`;
}
