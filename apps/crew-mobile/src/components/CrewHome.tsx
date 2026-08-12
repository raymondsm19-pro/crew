import { useState } from "react";
import { Text, TextInput, View, Pressable, ScrollView, StyleSheet } from "react-native";
import type { CrewStatus } from "@crew/shared";
import { useBreakToggle, useClockOut, useSignOut } from "@/api/hooks";
import { readCoords } from "@/lib/geolocation";
import { ClockInCard } from "./ClockInCard";
import { IncidentModal } from "./IncidentModal";
import { colors } from "./theme";

const hoursLabel = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function CrewHome({ status }: { status: CrewStatus }) {
  const breakToggle = useBreakToggle(status);
  const clockOut = useClockOut();
  const signOut = useSignOut();
  const [note, setNote] = useState("");
  const [showIncident, setShowIncident] = useState(false);

  const error = (breakToggle.error ?? clockOut.error) as Error | undefined;

  const doClockOut = async () => {
    const coords = await readCoords();
    clockOut.mutate({ note, ...coords }, { onSuccess: () => setNote("") });
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 16 }}>
      <View style={styles.card}>
        <Text style={styles.mutedSmall}>Signed in as</Text>
        <Text style={styles.name}>{status.worker.name}</Text>
        <Text style={styles.mutedSmall}>{status.worker.role || "Crew"}</Text>
        <View style={styles.hoursRow}>
          <Text style={styles.hoursValue}>{hoursLabel(status.todayMinutes)}</Text>
          <Text style={styles.mutedSmall}>worked today</Text>
        </View>
      </View>

      {status.openShift ? (
        <View style={styles.card}>
          <Text style={styles.mutedSmall}>On the clock at</Text>
          <Text style={styles.name}>{status.openShift.projectName}</Text>
          {status.openBreak && (
            <View style={styles.breakBanner}>
              <Text style={styles.breakBannerText}>On meal break since {timeLabel(status.openBreak.startedAt)}</Text>
            </View>
          )}

          <Pressable
            style={[styles.secondaryButton, breakToggle.isPending && styles.buttonDisabled]}
            disabled={breakToggle.isPending}
            onPress={() => breakToggle.mutate()}
          >
            <Text style={styles.secondaryButtonText}>
              {breakToggle.isPending
                ? status.openBreak
                  ? "Ending break…"
                  : "Starting break…"
                : status.openBreak
                  ? "End meal break"
                  : "Start meal break"}
            </Text>
          </Pressable>

          <Text style={[styles.label, { marginTop: 16 }]}>Note for today (optional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
            value={note}
            onChangeText={setNote}
            placeholder="What you worked on"
            multiline
          />

          <Pressable
            style={[styles.destructiveButton, (clockOut.isPending || !!status.openBreak) && styles.buttonDisabled]}
            disabled={clockOut.isPending || !!status.openBreak}
            onPress={doClockOut}
          >
            <Text style={styles.destructiveButtonText}>{clockOut.isPending ? "Clocking out…" : "Clock out"}</Text>
          </Pressable>
          {status.openBreak && <Text style={styles.centeredHint}>End your break before clocking out.</Text>}
        </View>
      ) : (
        <ClockInCard status={status} />
      )}

      {error && <Text style={styles.error}>{error.message}</Text>}

      {status.todayShifts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Today</Text>
          {status.todayShifts.map((s) => (
            <View key={s.id} style={styles.shiftRow}>
              <Text style={styles.shiftProject} numberOfLines={1}>
                {s.projectName}
              </Text>
              <Text style={styles.mutedSmall}>
                {timeLabel(s.clockInAt)} – {s.clockOutAt ? timeLabel(s.clockOutAt) : "now"}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.hazardButton} onPress={() => setShowIncident(true)}>
        <Text style={styles.hazardButtonText}>⚠ Report a hazard or injury</Text>
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={() => signOut.mutate()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      {showIncident && <IncidentModal status={status} onClose={() => setShowIncident(false)} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 20 },
  buttonDisabled: { opacity: 0.6 },
  mutedSmall: { fontSize: 13, color: colors.muted },
  name: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  hoursRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  hoursValue: { fontWeight: "700", color: colors.foreground },
  breakBanner: { backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10 },
  breakBannerText: { color: colors.accentForeground, fontWeight: "700", fontSize: 13 },
  secondaryButton: { backgroundColor: colors.secondary, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 16 },
  secondaryButtonText: { color: colors.secondaryForeground, fontWeight: "700", fontSize: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: colors.foreground },
  input: { borderWidth: 1, borderColor: colors.input, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.foreground },
  destructiveButton: { backgroundColor: colors.destructive, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 16 },
  destructiveButtonText: { color: colors.destructiveForeground, fontWeight: "700", fontSize: 16 },
  centeredHint: { textAlign: "center", fontSize: 13, color: colors.muted, marginTop: 8 },
  error: { color: colors.destructive, fontSize: 14, fontWeight: "600" },
  sectionHeading: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", color: colors.muted, marginBottom: 8 },
  shiftRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 4 },
  shiftProject: { flexShrink: 1, color: colors.foreground },
  hazardButton: { borderWidth: 1, borderColor: colors.destructive, borderRadius: 16, paddingVertical: 16, alignItems: "center", backgroundColor: colors.card },
  hazardButtonText: { color: colors.destructive, fontWeight: "700", fontSize: 16 },
  signOutButton: { alignItems: "center", paddingVertical: 16 },
  signOutText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
});
