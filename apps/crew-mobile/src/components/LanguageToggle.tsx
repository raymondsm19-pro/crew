import { Pressable, Text, View, StyleSheet } from "react-native";
import { useLanguage } from "@/i18n/LanguageContext";
import { colors } from "./theme";

const LANGUAGES = ["en", "es"] as const;

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      {LANGUAGES.map((lang) => {
        const active = language === lang;
        return (
          <Pressable key={lang} onPress={() => setLanguage(lang)} style={[styles.pill, active && styles.pillActive]}>
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{lang.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 3,
  },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillActive: { backgroundColor: colors.primary },
  pillText: { fontSize: 12, fontWeight: "700", color: colors.muted },
  pillTextActive: { color: colors.primaryForeground },
});
