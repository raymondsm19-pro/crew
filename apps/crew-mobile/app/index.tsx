import { useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useCrewStatus } from "@/api/hooks";
import { SignIn } from "@/components/SignIn";
import { CrewHome } from "@/components/CrewHome";
import { RequestsTab } from "@/components/RequestsTab";
import { colors } from "@/components/theme";

export default function Index() {
  const { data: status, isPending } = useCrewStatus();
  const [tab, setTab] = useState<"time" | "requests">("time");

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>⛑️</Text>
          <View>
            <Text style={styles.headerTitle}>Builtwell Crew</Text>
            <Text style={styles.headerSubtitle}>Time, breaks and safety</Text>
          </View>
        </View>

        {isPending ? (
          <ActivityIndicator style={{ marginTop: 48 }} />
        ) : status ? (
          <>
            <View style={styles.tabBar}>
              {(
                [
                  { key: "time", label: "Time & safety" },
                  { key: "requests", label: "Photos & requests" },
                ] as const
              ).map((t) => (
                <Pressable
                  key={t.key}
                  style={[styles.tabButton, tab === t.key && styles.tabButtonActive]}
                  onPress={() => setTab(t.key)}
                >
                  <Text style={[styles.tabButtonText, tab === t.key && styles.tabButtonTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
            {tab === "time" ? <CrewHome status={status} /> : <RequestsTab status={status} />}
          </>
        ) : (
          <SignIn />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  headerSubtitle: { fontSize: 13, color: colors.muted },
  tabBar: { flexDirection: "row", gap: 4, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 4 },
  tabButton: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  tabButtonActive: { backgroundColor: colors.primary },
  tabButtonText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  tabButtonTextActive: { color: colors.primaryForeground },
});
