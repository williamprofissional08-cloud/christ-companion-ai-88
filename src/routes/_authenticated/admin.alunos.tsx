import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminListMembers } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/alunos")({ component: AdminMembers });
function AdminMembers() {
  const list = useServerFn(adminListMembers);
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-members"], queryFn: () => list() });
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => data.filter((m) => [m.display_name, m.email, m.id].some((v) => v?.toLowerCase().includes(search.toLowerCase()))), [data, search]);
  return <AppShell title="Alunos e membros" subtitle="Visão administrativa de contas e atividade">
    <div className="mb-4 flex items-center justify-between gap-2"><Button asChild size="sm" variant="ghost"><Link to="/admin"><ArrowLeft className="mr-1 size-4"/>Painel</Link></Button><Badge variant="outline">{data.length} contas carregadas</Badge></div>
    <Card className="mb-4 flex items-center gap-3 p-4"><Users className="size-5 text-primary"/><div><p className="font-medium">Diretório de membros</p><p className="text-xs text-muted-foreground">Exibe até 500 contas mais recentes, sem expor credenciais.</p></div></Card>
    <div className="relative mb-4"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Buscar por nome, e-mail ou ID" value={search} onChange={(e)=>setSearch(e.target.value)}/></div>
    {isLoading ? <p className="text-sm text-muted-foreground">Carregando membros…</p> : error ? <Card className="p-4 text-sm text-destructive">{error.message}</Card> : <div className="space-y-2">{filtered.map((m)=><Card key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate font-medium">{m.display_name || "Nome não informado"}</p><p className="truncate text-sm text-muted-foreground">{m.email || m.id}</p><p className="text-xs text-muted-foreground">Cadastro: {new Date(m.created_at).toLocaleDateString("pt-BR")} · Último acesso: {m.last_seen_at ? new Date(m.last_seen_at).toLocaleDateString("pt-BR") : "—"}</p></div><Badge variant="outline">Membro</Badge></Card>)}{filtered.length===0&&<p className="py-8 text-center text-sm text-muted-foreground">Nenhum membro encontrado.</p>}</div>}
  </AppShell>;
}