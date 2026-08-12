import { Text, View, Pressable, StyleSheet } from "react-native";
import { SAFETY_ITEMS } from "@crew/shared";
import { colors } from "./theme";

export function SafetyChecklist({
  value,
  onChange,
}: {
  value: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      {SAFETY_ITEMS.map((item) => {
        const checked = !!value[item.key];
        return (
          <Pressable
            key={item.key}
            style={styles.row}
            onPress={() => onChange({ ...value, [item.key]: !checked })}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: { color: colors.primaryForeground, fontSize: 14, fontWeight: "700" },
  label: { fontSize: 16, flex: 1, color: colors.foreground },
});
