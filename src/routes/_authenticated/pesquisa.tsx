import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/pesquisa")({
  component: Page,
});

function Page() {
  return (
    <AppShell title="Pesquisa" subtitle="Em construção">
      <p className="text-sm text-muted-foreground">
        Esta área está sendo preparada. Volte em breve.
      </p>
    </AppShell>
  );
}
