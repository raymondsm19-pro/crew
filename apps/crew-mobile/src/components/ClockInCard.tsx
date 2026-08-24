import { useState } from "react";
import { Text, TextInput, View, Pressable, StyleSheet } from "react-native";
import type { CrewStatus } from "@crew/shared";
import { SAFETY_ITEMS } from "@crew/shared";
import { useClockIn } from "@/api/hooks";
import { readCoords } from "@/lib/geolocation";
import { useLanguage } from "@/i18n/LanguageContext";
import { SafetyChecklist } from "./SafetyChecklist";
import { ProjectPicker } from "./ProjectPicker";
import { colors } from "./theme";

export function ClockInCard({ status }: { status: CrewStatus }) {
  const clockIn = useClockIn();
  const [projectId, setProjectId] = useState(status.projects[0]?.id ?? "");
  const [safety, setSafety] = useState<Record<string, boolean>>({});
  const [safetyNote, setSafetyNote] = useState("");
  const { t } = useLanguage();

  const allChecked = SAFETY_ITEMS.every((i) => safety[i.key]);

  const submit = async () => {
    const coords = await readCoords();
    clockIn.mutate({ projectId, safety, safetyNote, ...coords });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("clockIn.title")}</Text>

      <Text style={styles.label}>{t("clockIn.projectLabel")}</Text>
      <ProjectPicker projects={status.projects} value={projectId} onChange={setProjectId} />

      <Text style={[styles.label, { marginTop: 16 }]}>{t("clockIn.safetyCheckLabel")}</Text>
      <SafetyChecklist value={safety} onChange={setSafety} />

      <Text style={[styles.label, { marginTop: 16 }]}>{t("clockIn.flagLabel")}</Text>
      <TextInput
        style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
        value={safetyNote}
        onChangeText={setSafetyNote}
        multiline
      />

      {!allChecked && <Text style={styles.hint}>{t("clockIn.hint")}</Text>}
      {clockIn.error && <Text style={styles.error}>{(clockIn.error as Error).message}</Text>}

      <Pressable
        style={[styles.button, (clockIn.isPending || !projectId) && styles.buttonDisabled]}
        disabled={clockIn.isPending || !projectId}
        onPress={submit}
      >
        <Text style={styles.buttonText}>{clockIn.isPending ? t("clockIn.clockingIn") : t("clockIn.clockIn")}</Text>
      </Pressable>
      <Text style={styles.footnote}>{t("clockIn.footnote")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 20 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: colors.foreground },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: colors.foreground },
  input: {
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.foreground,
  },
  hint: { fontSize: 13, color: colors.muted, marginTop: 12 },
  error: { color: colors.destructive, fontSize: 14, fontWeight: "600", marginTop: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.primaryForeground, fontSize: 17, fontWeight: "700" },
  footnote: { textAlign: "center", fontSize: 12, color: colors.muted, marginTop: 8 },
});
