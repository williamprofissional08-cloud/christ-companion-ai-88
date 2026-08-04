import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/estudos")({
  component: Page,
});

function Page() {
  return (
    <AppShell title="Estudos" subtitle="Em construção">
      <p className="text-sm text-muted-foreground">
        Esta área está sendo preparada. Volte em breve.
      </p>
    </AppShell>
  );
}
