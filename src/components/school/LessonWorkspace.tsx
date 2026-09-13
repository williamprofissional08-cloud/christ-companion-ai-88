import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookMarked, FilePenLine, Heart, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getLessonWorkspace,
  saveLessonReflection,
  saveSermonMessage,
  toggleStudyFavorite,
} from "@/lib/preacher-course.functions";

const emptyPoints = Array.from({ length: 3 }, () => ({
  title: "",
  explanation: "",
  references: "",
  application: "",
}));

export function LessonWorkspace({
  lessonId,
  courseId,
  lessonTitle,
  passage,
}: {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  passage: string | null;
}) {
  const queryClient = useQueryClient();
  const fetchWorkspace = useServerFn(getLessonWorkspace);
  const saveReflection = useServerFn(saveLessonReflection);
  const saveMessage = useServerFn(saveSermonMessage);
  const toggleFavorite = useServerFn(toggleStudyFavorite);
  const workspace = useQuery({
    queryKey: ["lesson-workspace", lessonId],
    queryFn: () => fetchWorkspace({ data: { lessonId } }),
  });
  const [reflection, setReflection] = useState({ meditation: "", prayerReflection: "", exerciseResponse: "" });
  const [message, setMessage] = useState({
    title: lessonTitle,
    scriptureText: passage ?? "",
    objective: "",
    introduction: "",
    points: emptyPoints,
    application: "",
    conclusion: "",
    notes: "",
  });

  useEffect(() => {
    const saved = workspace.data?.reflection;
    if (!saved) return;
    setReflection({
      meditation: saved.meditation,
      prayerReflection: saved.prayer_reflection,
      exerciseResponse: saved.exercise_response,
    });
  }, [workspace.data?.reflection]);

  const reflectionMutation = useMutation({
    mutationFn: () => saveReflection({ data: { lessonId, ...reflection } }),
    onSuccess: () => {
      toast.success("Sua reflexão foi salva.");
      queryClient.invalidateQueries({ queryKey: ["lesson-workspace", lessonId] });
    },
    onError: () => toast.error("Não foi possível salvar sua reflexão."),
  });
  const messageMutation = useMutation({
    mutationFn: () => saveMessage({ data: { ...message, lessonId, courseId } }),
    onSuccess: () => {
      toast.success("Mensagem salva em Minhas Mensagens.");
      queryClient.invalidateQueries({ queryKey: ["lesson-workspace", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["sermon-messages"] });
    },
    onError: () => toast.error("Não foi possível salvar a mensagem."),
  });
  const favoriteMutation = useMutation({
    mutationFn: () => toggleFavorite({ data: { lessonId, title: lessonTitle, active: !workspace.data?.favoriteId } }),
    onSuccess: () => {
      toast.success(workspace.data?.favoriteId ? "Estudo removido dos favoritos." : "Estudo salvo nos favoritos.");
      queryClient.invalidateQueries({ queryKey: ["lesson-workspace", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Caderno do pregador</h2>
          <p className="text-sm text-muted-foreground">Medite, responda e transforme o estudo em uma mensagem.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => favoriteMutation.mutate()} disabled={favoriteMutation.isPending}>
          <Heart className={workspace.data?.favoriteId ? "mr-1 size-4 fill-current" : "mr-1 size-4"} />
          {workspace.data?.favoriteId ? "Favoritado" : "Favoritar estudo"}
        </Button>
      </div>
      <Tabs defaultValue="reflexao">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reflexao" className="gap-1"><BookMarked className="size-4" /> Meditação</TabsTrigger>
          <TabsTrigger value="mensagem" className="gap-1"><FilePenLine className="size-4" /> Minha mensagem</TabsTrigger>
        </TabsList>
        <TabsContent value="reflexao" className="mt-4 space-y-4">
          <Field label="Minha meditação" value={reflection.meditation} onChange={(value) => setReflection((old) => ({ ...old, meditation: value }))} placeholder="O que observei sobre Deus, o texto e seu contexto?" />
          <Field label="O que esta Palavra falou comigo?" value={reflection.prayerReflection} onChange={(value) => setReflection((old) => ({ ...old, prayerReflection: value }))} placeholder="Registre convicções, consolo e direção." />
          <Field label="Resposta ao exercício" value={reflection.exerciseResponse} onChange={(value) => setReflection((old) => ({ ...old, exerciseResponse: value }))} placeholder="Responda ao exercício proposto no estudo." />
          <Button onClick={() => reflectionMutation.mutate()} disabled={reflectionMutation.isPending}>
            <Save className="mr-1 size-4" /> {reflectionMutation.isPending ? "Salvando…" : "Salvar reflexão"}
          </Button>
        </TabsContent>
        <TabsContent value="mensagem" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Tema" value={message.title} onChange={(value) => setMessage((old) => ({ ...old, title: value }))} />
            <TextInput label="Texto-base" value={message.scriptureText} onChange={(value) => setMessage((old) => ({ ...old, scriptureText: value }))} />
          </div>
          <Field label="Objetivo" value={message.objective} onChange={(value) => setMessage((old) => ({ ...old, objective: value }))} />
          <Field label="Introdução" value={message.introduction} onChange={(value) => setMessage((old) => ({ ...old, introduction: value }))} />
          {message.points.map((point, index) => (
            <div key={index} className="space-y-3 border-l-2 border-primary/30 pl-4">
              <p className="text-sm font-semibold">Ponto {index + 1}</p>
              <TextInput label="Título" value={point.title} onChange={(value) => setMessage((old) => ({ ...old, points: old.points.map((item, i) => i === index ? { ...item, title: value } : item) }))} />
              <Field label="Explicação" value={point.explanation} onChange={(value) => setMessage((old) => ({ ...old, points: old.points.map((item, i) => i === index ? { ...item, explanation: value } : item) }))} />
              <TextInput label="Referências" value={point.references} onChange={(value) => setMessage((old) => ({ ...old, points: old.points.map((item, i) => i === index ? { ...item, references: value } : item) }))} />
              <Field label="Aplicação" value={point.application} onChange={(value) => setMessage((old) => ({ ...old, points: old.points.map((item, i) => i === index ? { ...item, application: value } : item) }))} />
            </div>
          ))}
          <Field label="Aplicação final" value={message.application} onChange={(value) => setMessage((old) => ({ ...old, application: value }))} />
          <Field label="Conclusão" value={message.conclusion} onChange={(value) => setMessage((old) => ({ ...old, conclusion: value }))} />
          <Field label="Observações" value={message.notes} onChange={(value) => setMessage((old) => ({ ...old, notes: value }))} />
          <Button onClick={() => messageMutation.mutate()} disabled={messageMutation.isPending || !message.title.trim()}>
            <Save className="mr-1 size-4" /> {messageMutation.isPending ? "Salvando…" : "Salvar em Minhas Mensagens"}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Textarea aria-label={label} rows={4} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></div>;
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}