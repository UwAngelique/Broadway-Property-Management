import * as SecureStore from "expo-secure-store";
import { getApiUrl } from "./config";

export async function clearSession() {
  await SecureStore.deleteItemAsync("access");
  await SecureStore.deleteItemAsync("refresh");
  await SecureStore.deleteItemAsync("user");
}

export async function logoutServer() {
  const token = await SecureStore.getItemAsync("access");
  if (!token) return;
  try {
    const base = getApiUrl().replace(/\/$/, "");
    await fetch(`${base}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /* ignore */
  }
}
