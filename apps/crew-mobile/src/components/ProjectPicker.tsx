import { Text, View, ScrollView, Pressable, StyleSheet } from "react-native";
import { colors } from "./theme";

export function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {projects.map((p) => {
          const active = p.id === value;
          return (
            <Pressable
              key={p.id}
              onPress={() => onChange(p.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.foreground, fontSize: 14, fontWeight: "600" },
  chipTextActive: { color: colors.primaryForeground },
});
