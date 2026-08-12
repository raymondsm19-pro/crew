/**
 * Office view of the crew screen: who is on the clock, today's punches, weekly
 * hours, safety sign-offs and hazard reports, plus worker + password setup.
 * Everything is gated by the crew admin code, which the server verifies.
 *
 * Ported from the source app's CrewAdmin.tsx — the only functional changes
 * are calling the Edge Functions via `api.ts` instead of `useServerFn`, and
 * the addition of <ProjectManager/> next to <WorkerManager/>.
 */
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "@/lib/api";
import type { AdminBoard } from "@crew/shared";
import { ClockInMap, type MapPoint } from "./ClockInMap";
import { ProjectManager } from "./ProjectManager";

type CrewInput = AdminBoard["incidents"][number];

const card = "rounded-2xl border border-border bg-card p-5 shadow-sm";
const field = "w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring";
const heading = "mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground";

export function CrewAdmin() {
  const [pin, setPin] = useState("");
  const [board, setBoard] = useState<AdminBoard | null>(null);
  const [mapPoint, setMapPoint] = useState<MapPoint | null>(null);
  const [openInput, setOpenInput] = useState<CrewInput | null>(null);

  const unlock = useMutation({
    mutationFn: () => api.adminBoard(pin),
    onSuccess: setBoard,
  });

  if (!board) {
    return (
      <form
        className={`mx-auto mt-16 max-w-sm ${card}`}
        onSubmit={(e) => {
          e.preventDefault();
          unlock.mutate();
        }}
      >
        <h1 className="mb-2 text-lg font-semibold">Crew admin</h1>
        <p className="mb-4 text-sm text-muted-foreground">Enter the crew admin code to manage workers and hours.</p>
        <input
          className={`${field} mb-3`}
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Admin code"
        />
        {unlock.error && <p className="mb-3 text-sm text-destructive">{(unlock.error as Error).message}</p>}
        <button
          className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
          type="submit"
          disabled={unlock.isPending}
        >
          {unlock.isPending ? "Checking…" : "Unlock"}
        </button>
      </form>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-5">
      <h1 className="text-2xl font-bold">Crew &amp; timesheets</h1>

      <section className={card}>
        <h2 className={heading}>On the clock now</h2>
        {board.onSite.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody is clocked in.</p>
        ) : (
          <ul className="space-y-2">
            {board.onSite.map((r) => (
              <li key={`${r.workerId}-${r.clockIn}`} className="flex justify-between gap-4 text-sm">
                <span className="font-medium">
                  {r.worker}
                  {r.onBreak && <span className="ml-2 text-accent-foreground">(on break)</span>}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span>
                    {r.project} · in {r.clockIn} · {(r.minutes / 60).toFixed(2)} h
                  </span>
                  {typeof r.lat === "number" && typeof r.lng === "number" ? (
                    <button
                      className="rounded-lg border border-border px-2 py-0.5 text-xs"
                      onClick={() =>
                        setMapPoint({
                          label: `${r.worker} clocked in`,
                          lat: r.lat as number,
                          lng: r.lng as number,
                          accuracy: r.accuracy,
                          detail: `${r.project} · ${r.clockIn}`,
                        })
                      }
                    >
                      Map
                    </button>
                  ) : (
                    <span className="text-xs">no location</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className={card}>
          <h2 className={heading}>Today's punches</h2>
          {board.today.length === 0 ? (
            <p className="text-sm text-muted-foreground">No punches today.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {board.today.map((r, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate">
                    {r.worker} · {r.project}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    <span>
                      {r.clockIn}–{r.clockOut} · {r.hours} h
                    </span>
                    {typeof r.lat === "number" && typeof r.lng === "number" && (
                      <button
                        className="rounded-lg border border-border px-2 py-0.5 text-xs"
                        onClick={() =>
                          setMapPoint({
                            label: `${r.worker} clocked in`,
                            lat: r.lat as number,
                            lng: r.lng as number,
                            accuracy: r.accuracy,
                            detail: `${r.project} · ${r.clockIn}`,
                          })
                        }
                      >
                        Map
                      </button>
                    )}
                    {typeof r.outLat === "number" && typeof r.outLng === "number" && (
                      <button
                        className="rounded-lg border border-border px-2 py-0.5 text-xs"
                        onClick={() =>
                          setMapPoint({
                            label: `${r.worker} clocked out`,
                            lat: r.outLat as number,
                            lng: r.outLng as number,
                            detail: `${r.project} · ${r.clockOut}`,
                          })
                        }
                      >
                        Out
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className={heading}>Last 7 days</h2>
          {board.week.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hours yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {board.week.map((r) => (
                <li key={r.worker} className="flex justify-between gap-3">
                  <span>{r.worker}</span>
                  <span className="text-muted-foreground">
                    {r.hours} h · {r.days} day(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className={heading}>Safety sign-offs today</h2>
          {board.safety.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sign-offs yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {board.safety.map((r, i) => (
                <li key={i}>
                  <span className={r.flagged ? "font-semibold text-destructive" : "font-medium"}>{r.worker}</span>{" "}
                  <span className="text-muted-foreground">
                    {r.project} {r.flagged ? "· concern flagged" : "· all clear"}
                  </span>
                  {r.note && <p className="text-muted-foreground">{r.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className={heading}>Crew inputs &amp; hazards (7 days) — tap to open</h2>
          {board.incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing reported.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {board.incidents.map((r) => (
                <li key={r.id}>
                  <button
                    className="w-full rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60 active:bg-muted"
                    onClick={() => setOpenInput(r)}
                  >
                    <span className={r.urgent ? "font-semibold text-destructive" : "font-medium"}>
                      {r.kind}
                      {r.urgent ? " · URGENT" : ""}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {r.project} · {r.worker} · {r.date} {r.time}
                      {r.photos.length > 0 && ` · ${r.photos.length} file(s)`}
                    </span>
                    <span className="block truncate text-muted-foreground">{r.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <WorkerManager pin={pin} board={board} onChange={setBoard} />
      <ProjectManager pin={pin} />
      {mapPoint && <ClockInMap point={mapPoint} onClose={() => setMapPoint(null)} />}
      {openInput && <CrewInputDialog input={openInput} onClose={() => setOpenInput(null)} />}
    </div>
  );
}

function CrewInputDialog({ input, onClose }: { input: CrewInput; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className={input.urgent ? "text-lg font-bold text-destructive" : "text-lg font-bold"}>
              {input.kind}
              {input.urgent ? " · URGENT" : ""}
            </h3>
            <p className="text-sm text-muted-foreground">
              {input.worker} · {input.project} · {input.date} {input.time} · {input.status}
            </p>
          </div>
          <button className="rounded-lg border border-border px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{input.description || "No description given."}</p>

        {input.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {input.photos.map((url, i) => {
              const clean = url.split("?")[0]!.toLowerCase();
              const isVideo = /\.(mp4|mov|m4v|webm)$/.test(clean);
              const isImage = /\.(jpe?g|png|gif|webp|heic|heif)$/.test(clean);
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-xl border border-border bg-muted"
                >
                  {isImage ? (
                    <img src={url} alt={`Attachment ${i + 1}`} className="h-40 w-full object-cover" loading="lazy" />
                  ) : isVideo ? (
                    <video src={url} controls className="h-40 w-full bg-black object-contain" />
                  ) : (
                    <span className="block px-3 py-6 text-center text-sm font-medium">Open file {i + 1}</span>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkerManager({
  pin,
  board,
  onChange,
}: {
  pin: string;
  board: AdminBoard;
  onChange: (next: AdminBoard) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");

  const add = useMutation({
    mutationFn: () => api.saveWorker({ pin, name, phone, role, password }),
    onSuccess: (next) => {
      setName("");
      setPhone("");
      setRole("");
      setPassword("");
      onChange(next);
    },
  });

  const reset = useMutation({
    mutationFn: (vars: { id: string; name: string; phone: string; role: string; password?: string; active?: boolean }) =>
      api.saveWorker({ pin, ...vars }),
    onSuccess: onChange,
  });

  return (
    <section className={card}>
      <h2 className={heading}>Crew list</h2>

      <ul className="mb-6 space-y-2 text-sm">
        {board.workers.map((w) => (
          <li key={w.id} className="flex flex-wrap items-center justify-between gap-3">
            <span>
              <span className={w.active ? "font-medium" : "font-medium text-muted-foreground line-through"}>
                {w.name}
              </span>{" "}
              <span className="text-muted-foreground">
                {w.phone} {w.role && `· ${w.role}`}
              </span>
            </span>
            <span className="flex gap-2">
              <button
                className="rounded-lg border border-border px-3 py-1"
                onClick={() => {
                  const next = window.prompt(`New password for ${w.name}`);
                  if (next) reset.mutate({ id: w.id, name: w.name, phone: w.phone, role: w.role, password: next, active: w.active });
                }}
              >
                Reset password
              </button>
              <button
                className="rounded-lg border border-border px-3 py-1"
                onClick={() => reset.mutate({ id: w.id, name: w.name, phone: w.phone, role: w.role, active: !w.active })}
              >
                {w.active ? "Deactivate" : "Reactivate"}
              </button>
            </span>
          </li>
        ))}
      </ul>

      <form
        className="grid gap-3 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
        <input className={field} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Trade / role" />
        <input className={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button
          className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground md:col-span-4"
          type="submit"
          disabled={add.isPending}
        >
          {add.isPending ? "Adding…" : "Add worker"}
        </button>
      </form>
      {(add.error || reset.error) && (
        <p className="mt-3 text-sm text-destructive">{((add.error ?? reset.error) as Error).message}</p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Workers sign in from the Builtwell Crew mobile app with their phone number and this password.
      </p>
    </section>
  );
}
