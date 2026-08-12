/** Shared, client-safe shapes for the crew (labor) app and admin dashboard. */

export type CrewWorker = { id: string; name: string; phone: string; role: string };

export type CrewBreak = { id: string; startedAt: string; endedAt: string | null; minutes: number | null };

export type CrewShift = {
  id: string;
  projectId: string;
  projectName: string;
  workDate: string;
  clockInAt: string;
  clockOutAt: string | null;
  breakMinutes: number;
  workedMinutes: number | null;
  breaks: CrewBreak[];
};

export type CrewStatus = {
  worker: CrewWorker;
  projects: { id: string; label: string }[];
  openShift: CrewShift | null;
  openBreak: CrewBreak | null;
  todayShifts: CrewShift[];
  todayMinutes: number;
  safetyDone: boolean;
};

export type AdminWorker = CrewWorker & { active: boolean };

export type AdminBoard = {
  workers: AdminWorker[];
  onSite: {
    workerId: string;
    worker: string;
    project: string;
    clockIn: string;
    onBreak: boolean;
    minutes: number;
    lat?: number | null;
    lng?: number | null;
    accuracy?: number | null;
  }[];
  today: {
    worker: string;
    project: string;
    clockIn: string;
    clockOut: string;
    breakMinutes: number;
    hours: string;
    lat?: number | null;
    lng?: number | null;
    accuracy?: number | null;
    outLat?: number | null;
    outLng?: number | null;
  }[];
  week: { worker: string; hours: string; days: number }[];
  safety: { worker: string; project: string; flagged: boolean; note: string }[];
  incidents: {
    id: string;
    worker: string;
    project: string;
    kind: string;
    description: string;
    urgent: boolean;
    date: string;
    time: string;
    status: string;
    photos: string[];
  }[];
};

export type Project = { id: string; name: string; active: boolean };
