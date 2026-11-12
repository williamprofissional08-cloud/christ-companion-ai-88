import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/comunidade_/privado")({ component: () => <Outlet /> });