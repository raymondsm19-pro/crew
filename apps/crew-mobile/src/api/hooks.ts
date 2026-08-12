/**
 * React Query hooks mirroring the source app's CrewApp.tsx ergonomics
 * (same STATUS_KEY query-key + setQueryData pattern), just backed by fetch
 * calls to the Edge Functions instead of TanStack Start server functions.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CrewStatus } from "@crew/shared";
import * as crew from "./crew";

export const STATUS_KEY = ["crew-status"];

export function useCrewStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: async () => {
      try {
        return await crew.getStatus();
      } catch {
        // 401 (no/expired session) means "show sign-in", same as the source
        // app's getCrewStatus() resolving to null.
        return null;
      }
    },
    refetchInterval: 60_000,
  });
}

export function useSetStatus() {
  const queryClient = useQueryClient();
  return (next: CrewStatus | null) => queryClient.setQueryData(STATUS_KEY, next);
}

export function useSignIn() {
  const setStatus = useSetStatus();
  return useMutation({
    mutationFn: (input: { phone: string; password: string }) => crew.signIn(input),
    onSuccess: (res) => setStatus(res.status),
  });
}

export function useSignOut() {
  const setStatus = useSetStatus();
  return useMutation({
    mutationFn: () => crew.signOut(),
    onSuccess: () => setStatus(null),
  });
}

export function useClockIn() {
  const setStatus = useSetStatus();
  return useMutation({
    mutationFn: crew.clockIn,
    onSuccess: setStatus,
  });
}

export function useClockOut() {
  const setStatus = useSetStatus();
  return useMutation({
    mutationFn: crew.clockOut,
    onSuccess: setStatus,
  });
}

export function useBreakToggle(status: CrewStatus) {
  const setStatus = useSetStatus();
  return useMutation({
    mutationFn: () => (status.openBreak ? crew.endBreak() : crew.startBreak()),
    onSuccess: setStatus,
  });
}

export function useReportIncident() {
  return useMutation({ mutationFn: crew.reportIncident });
}
