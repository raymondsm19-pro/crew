import { useState } from "react";
import { Text, TextInput, View, Pressable, Switch, StyleSheet } from "react-native";
import type { CrewStatus } from "@crew/shared";
import { REQUEST_KINDS } from "@crew/shared";
import { useReportIncident } from "@/api/hooks";
import { assetToEncodedFile, pickFromCamera, pickFromLibrary } from "@/lib/files";
import { ProjectPicker } from "./ProjectPicker";
import { colors } from "./theme";

/** Photos + questions the crew sends to the office, with optional media. */
export function RequestsTab({ status }: { status: CrewStatus }) {
  const report = useReportIncident();
  const [projectId, setProjectId] = useState(status.openShift?.projectId ?? status.projects[0]?.id ?? "");
  const [kind, setKind] = useState<string>(REQUEST_KINDS[0]);
  const [description, setDescription] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [files, setFiles] = useState<Awaited<ReturnType<typeof assetToEncodedFile>>[]>([]);
  const [sent, setSent] = useState(false);

  const addFiles = async (fromCamera: boolean) => {
    const assets = fromCamera ? await pickFromCamera() : await pickFromLibrary();
    const encoded = await Promise.all(assets.slice(0, 4).map(assetToEncodedFile));
    setFiles((prev) => [...prev, ...encoded].slice(0, 4));
    setFileCount((c) => Math.min(4, c + encoded.length));
  };

  const submit = () => {
    report.mutate(
      { projectId, kind, description, urgent, files },
      {
        onSuccess: () => {
          setDescription("");
          setFiles([]);
          setFileCount(0);
          setUrgent(false);
          setSent(true);
        },
      },
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Send photos or a question</Text>
      <Text style={styles.subtitle}>Attach jobsite photos or a video and ask the office anything.</Text>

      <Text style={styles.label}>Project</Text>
      <ProjectPicker projects={status.projects} value={projectId} onChange={setProjectId} />

      <Text style={[styles.label, { marginTop: 16 }]}>Type</Text>
      <ProjectPicker projects={REQUEST_KINDS.map((k) => ({ id: k, label: k }))} value={kind} onChange={setKind} />

      <Text style={[styles.label, { marginTop: 16 }]}>Your question or request or daily update</Text>
      <TextInput
        style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]}
        value={description}
        onChangeText={(v) => {
          setDescription(v);
          setSent(false);
        }}
        placeholder="What do you need? Add details so the office can answer fast."
        multiline
      />

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <Pressable style={styles.secondaryButton} onPress={() => addFiles(true)}>
          <Text style={styles.secondaryButtonText}>Camera</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => addFiles(false)}>
          <Text style={styles.secondaryButtonText}>{fileCount ? `${fileCount} file(s) attached` : "Add from library"}</Text>
        </Pressable>
      </View>

      <View style={styles.urgentRow}>
        <Text style={styles.urgentLabel}>Urgent — office should see this now</Text>
        <Switch value={urgent} onValueChange={setUrgent} />
      </View>

      {report.error && <Text style={styles.error}>{(report.error as Error).message}</Text>}
      {sent && !report.isPending && <Text style={styles.success}>Sent to the office.</Text>}

      <Pressable
        style={[styles.button, (report.isPending || !projectId || !description.trim()) && styles.buttonDisabled]}
        disabled={report.isPending || !projectId || !description.trim()}
        onPress={submit}
      >
        <Text style={styles.buttonText}>{report.isPending ? "Sending…" : "Send to office"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 20 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 4, color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 16 },
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
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
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
  success: { color: colors.brand, fontSize: 14, fontWeight: "600", marginTop: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.primaryForeground, fontSize: 17, fontWeight: "700" },
});
