import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: Page,
});

function Page() {
  return (
    <AppShell title="Início" subtitle="Em construção">
      <p className="text-sm text-muted-foreground">
        Esta área está sendo preparada. Volte em breve.
      </p>
    </AppShell>
  );
}
