import { useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useCrewStatus } from "@/api/hooks";
import { SignIn } from "@/components/SignIn";
import { CrewHome } from "@/components/CrewHome";
import { RequestsTab } from "@/components/RequestsTab";
import { LanguageToggle } from "@/components/LanguageToggle";
import { colors } from "@/components/theme";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Index() {
  const { data: status, isPending } = useCrewStatus();
  const [tab, setTab] = useState<"time" | "requests">("time");
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerEmoji}>⛑️</Text>
            <View>
              <Text style={styles.headerTitle}>{t("app.title")}</Text>
              <Text style={styles.headerSubtitle}>{t("app.subtitle")}</Text>
            </View>
          </View>
          <LanguageToggle />
        </View>

        {isPending ? (
          <ActivityIndicator style={{ marginTop: 48 }} />
        ) : status ? (
          <>
            <View style={styles.tabBar}>
              {(
                [
                  { key: "time", label: t("tabs.time") },
                  { key: "requests", label: t("tabs.requests") },
                ] as const
              ).map((tabItem) => (
                <Pressable
                  key={tabItem.key}
                  style={[styles.tabButton, tab === tabItem.key && styles.tabButtonActive]}
                  onPress={() => setTab(tabItem.key)}
                >
                  <Text style={[styles.tabButtonText, tab === tabItem.key && styles.tabButtonTextActive]}>
                    {tabItem.label}
                  </Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  headerSubtitle: { fontSize: 13, color: colors.muted },
  tabBar: { flexDirection: "row", gap: 4, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 4 },
  tabButton: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  tabButtonActive: { backgroundColor: colors.primary },
  tabButtonText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  tabButtonTextActive: { color: colors.primaryForeground },
});
