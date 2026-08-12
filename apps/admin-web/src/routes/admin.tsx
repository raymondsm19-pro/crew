import { createFileRoute } from "@tanstack/react-router";
import { CrewAdmin } from "@/components/crew/CrewAdmin";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Crew Admin — Workers, Hours & Safety Logs" }] }),
  component: CrewAdmin,
});
