import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "crew_token";
const EXPIRES_KEY = "crew_token_expires_at";

export async function saveToken(token: string, expiresAt: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(EXPIRES_KEY, expiresAt);
}

export async function readToken(): Promise<{ token: string; expiresAt: string } | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const expiresAt = await SecureStore.getItemAsync(EXPIRES_KEY);
  if (!token || !expiresAt) return null;
  if (new Date(expiresAt) < new Date()) return null;
  return { token, expiresAt };
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(EXPIRES_KEY);
}
