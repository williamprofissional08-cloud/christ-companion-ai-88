import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminGetSubscriptionOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/assinaturas")({ component: AdminSubscriptions });
function AdminSubscriptions() {
  const fetchOverview = useServerFn(adminGetSubscriptionOverview);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-subscriptions"], queryFn: () => fetchOverview() });
  const totals = data?.totals;
  const metrics = [{label:"Ativas",value:totals?.active},{label:"Em teste",value:totals?.trialing},{label:"Atrasadas",value:totals?.pastDue},{label:"Canceladas",value:totals?.canceled},{label:"Premium ativo",value:totals?.premium}];
  return <AppShell title="Assinaturas e planos" subtitle="Acompanhamento comercial e preparação para cobrança">
    <div className="mb-4"><Button asChild size="sm" variant="ghost"><Link to="/admin"><ArrowLeft className="mr-1 size-4"/>Painel</Link></Button></div>
    <Card className="mb-5 flex gap-3 p-4"><CreditCard className="size-5 text-primary"/><div><p className="font-medium">Monitoramento — somente leitura</p><p className="text-xs text-muted-foreground">Esta tela consulta os planos e registros existentes. Não processa pagamentos, não cancela cobranças e não altera assinaturas.</p></div></Card>
    {isLoading?<p className="text-sm text-muted-foreground">Carregando dados…</p>:error?<Card className="p-4 text-sm text-destructive">{error.message}</Card>:<>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{metrics.map(m=><Card key={m.label} className="p-4"><p className="text-xs text-muted-foreground">{m.label}</p><p className="mt-1 text-2xl font-semibold">{m.value??0}</p></Card>)}</div>
      <h2 className="mb-3 font-semibold">Planos cadastrados</h2><div className="mb-6 space-y-2">{data?.plans.map(p=><Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.slug} · {p.billing_interval} · {p.tier}</p></div><div className="flex items-center gap-2"><strong>{(p.price_cents/100).toLocaleString("pt-BR",{style:"currency",currency:p.currency||"BRL"})}</strong><Badge variant={p.is_active?"default":"outline"}>{p.is_active?"Ativo":"Inativo"}</Badge></div></Card>)}{!data?.plans.length&&<p className="text-sm text-muted-foreground">Nenhum plano cadastrado.</p>}</div>
      <h2 className="mb-3 font-semibold">Assinaturas recentes</h2><div className="space-y-2">{data?.subscriptions.map(s=><Card key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-4"><div><p className="font-medium">{s.tier.toUpperCase()} · {s.provider||"Provedor não definido"}</p><p className="text-xs text-muted-foreground">Conta: {s.user_id} · Início: {new Date(s.created_at).toLocaleDateString("pt-BR")}</p><p className="text-xs text-muted-foreground">Período até: {s.current_period_end?new Date(s.current_period_end).toLocaleDateString("pt-BR"):"Não informado"}</p></div><Badge variant={s.status==="active"?"default":"outline"}>{s.status}</Badge></Card>)}{!data?.subscriptions.length&&<p className="text-sm text-muted-foreground">Nenhuma assinatura registrada.</p>}</div>
    </>}
  </AppShell>;
}