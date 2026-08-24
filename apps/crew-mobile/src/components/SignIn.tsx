import { useState } from "react";
import { Text, TextInput, View, Pressable, StyleSheet } from "react-native";
import { useSignIn } from "@/api/hooks";
import { useLanguage } from "@/i18n/LanguageContext";
import { colors } from "./theme";

export function SignIn() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const signIn = useSignIn();
  const { t } = useLanguage();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("signIn.title")}</Text>
      <Text style={styles.subtitle}>{t("signIn.subtitle")}</Text>

      <Text style={styles.label}>{t("signIn.phoneLabel")}</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        autoComplete="tel"
        value={phone}
        onChangeText={setPhone}
        placeholder={t("signIn.phonePlaceholder")}
      />

      <Text style={styles.label}>{t("signIn.passwordLabel")}</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
      />

      {signIn.error && <Text style={styles.error}>{(signIn.error as Error).message}</Text>}

      <Pressable
        style={[styles.button, signIn.isPending && styles.buttonDisabled]}
        disabled={signIn.isPending}
        onPress={() => signIn.mutate({ phone, password })}
      >
        <Text style={styles.buttonText}>{signIn.isPending ? t("signIn.signingIn") : t("signIn.submit")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 20 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 4, color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: colors.foreground },
  input: {
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    color: colors.foreground,
  },
  error: { color: colors.destructive, fontSize: 14, fontWeight: "600", marginBottom: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.primaryForeground, fontSize: 17, fontWeight: "700" },
});
