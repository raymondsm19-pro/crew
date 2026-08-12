/**
 * CRUD panel for the `projects` table — replaces the source app's
 * boards.ts-derived project list. Mirrors WorkerManager's list + add-form +
 * active/inactive toggle pattern in CrewAdmin.tsx.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Project } from "@crew/shared";
import { api } from "@/lib/api";

const card = "rounded-2xl border border-border bg-card p-5 shadow-sm";
const field = "w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring";
const heading = "mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground";

export function ProjectManager({ pin }: { pin: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["crew-projects", pin];
  const { data: projects } = useQuery<Project[]>({
    queryKey,
    queryFn: () => api.listProjects(pin),
  });
  const [name, setName] = useState("");

  const setProjects = (next: Project[]) => queryClient.setQueryData(queryKey, next);

  const add = useMutation({
    mutationFn: () => api.saveProject({ pin, name }),
    onSuccess: (next) => {
      setName("");
      setProjects(next);
    },
  });

  const toggle = useMutation({
    mutationFn: (p: Project) => api.saveProject({ pin, id: p.id, name: p.name, active: !p.active }),
    onSuccess: setProjects,
  });

  return (
    <section className={card}>
      <h2 className={heading}>Projects</h2>

      <ul className="mb-6 space-y-2 text-sm">
        {(projects ?? []).map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3">
            <span className={p.active ? "font-medium" : "font-medium text-muted-foreground line-through"}>
              {p.name}
            </span>
            <button className="rounded-lg border border-border px-3 py-1" onClick={() => toggle.mutate(p)}>
              {p.active ? "Deactivate" : "Reactivate"}
            </button>
          </li>
        ))}
        {projects && projects.length === 0 && <li className="text-muted-foreground">No projects yet.</li>}
      </ul>

      <form
        className="grid gap-3 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <input
          className={`${field} md:col-span-3`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
        />
        <button
          className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
          type="submit"
          disabled={add.isPending || !name.trim()}
        >
          {add.isPending ? "Adding…" : "Add project"}
        </button>
      </form>
      {(add.error || toggle.error) && (
        <p className="mt-3 text-sm text-destructive">{((add.error ?? toggle.error) as Error).message}</p>
      )}
    </section>
  );
}
