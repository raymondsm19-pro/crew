import { useState } from "react";
import { Modal, Text, TextInput, View, Pressable, ScrollView, Switch, StyleSheet } from "react-native";
import type { CrewStatus } from "@crew/shared";
import { INCIDENT_KINDS } from "@crew/shared";
import { useReportIncident } from "@/api/hooks";
import { assetToEncodedFile, pickFromCamera, pickFromLibrary } from "@/lib/files";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { ProjectPicker } from "./ProjectPicker";
import { colors } from "./theme";

export function IncidentModal({ status, onClose }: { status: CrewStatus; onClose: () => void }) {
  const report = useReportIncident();
  const { t } = useLanguage();
  const [projectId, setProjectId] = useState(status.openShift?.projectId ?? status.projects[0]?.id ?? "");
  const [kind, setKind] = useState<string>(INCIDENT_KINDS[0].value);
  const [description, setDescription] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [files, setFiles] = useState<Awaited<ReturnType<typeof assetToEncodedFile>>[]>([]);

  const addFiles = async (fromCamera: boolean) => {
    const assets = fromCamera ? await pickFromCamera() : await pickFromLibrary();
    const encoded = await Promise.all(assets.slice(0, 4).map(assetToEncodedFile));
    setFiles((prev) => [...prev, ...encoded].slice(0, 4));
    setFileCount((c) => Math.min(4, c + encoded.length));
  };

  const submit = () => {
    report.mutate(
      { projectId, kind, description, urgent, files },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.card }} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>{t("incident.reportTitle")}</Text>

        <Text style={styles.label}>{t("incident.projectLabel")}</Text>
        <ProjectPicker projects={status.projects} value={projectId} onChange={setProjectId} />

        <Text style={[styles.label, { marginTop: 16 }]}>{t("incident.typeLabel")}</Text>
        <ProjectPicker
          projects={INCIDENT_KINDS.map((k) => ({ id: k.value, label: t(`incident.kind.${k.key}` as TranslationKey) }))}
          value={kind}
          onChange={setKind}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>{t("incident.whatHappenedLabel")}</Text>
        <TextInput
          style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <Pressable style={styles.secondaryButton} onPress={() => addFiles(true)}>
            <Text style={styles.secondaryButtonText}>{t("incident.camera")}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => addFiles(false)}>
            <Text style={styles.secondaryButtonText}>
              {fileCount ? t("incident.filesAttached", { count: fileCount }) : t("incident.addFromLibrary")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.urgentRow}>
          <Text style={styles.urgentLabel}>{t("incident.urgent")}</Text>
          <Switch value={urgent} onValueChange={setUrgent} />
        </View>

        {report.error && <Text style={styles.error}>{(report.error as Error).message}</Text>}

        <Pressable
          style={[styles.button, report.isPending && styles.buttonDisabled]}
          disabled={report.isPending}
          onPress={submit}
        >
          <Text style={styles.buttonText}>{report.isPending ? t("incident.sending") : t("incident.sendReport")}</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>{t("incident.cancel")}</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: colors.foreground },
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
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: { fontWeight: "600", color: colors.foreground },
  urgentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  urgentLabel: { fontSize: 15, fontWeight: "600", flex: 1, marginRight: 12, color: colors.foreground },
  error: { color: colors.destructive, fontSize: 14, fontWeight: "600", marginTop: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.primaryForeground, fontSize: 17, fontWeight: "700" },
  cancelButton: { paddingVertical: 16, alignItems: "center" },
  cancelButtonText: { color: colors.muted, fontWeight: "600" },
});
