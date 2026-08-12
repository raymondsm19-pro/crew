import { useState } from "react";
import { Text, TextInput, View, Pressable, StyleSheet } from "react-native";
import { useSignIn } from "@/api/hooks";
import { colors } from "./theme";

export function SignIn() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const signIn = useSignIn();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Use your phone number and the password the office gave you.</Text>

      <Text style={styles.label}>Phone number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        autoComplete="tel"
        value={phone}
        onChangeText={setPhone}
        placeholder="510 555 1234"
      />

      <Text style={styles.label}>Password</Text>
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
        <Text style={styles.buttonText}>{signIn.isPending ? "Signing in…" : "Sign in"}</Text>
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
