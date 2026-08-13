import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/escola/$slug")({
  component: () => <Outlet />,
});
