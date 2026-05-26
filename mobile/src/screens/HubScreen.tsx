import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiToLocale, localeToApi, type AppLocale } from "../../shared/i18n";
import { apiRequest } from "../api";
import { connectRealtime } from "../realtime";
import type { RootStackParamList } from "../navigation/types";

const SYNC_INTERVAL_MS = 60_000;
const REVISION_KEY = "sync_revision";
const LOCALE_KEY = "pm_locale";

type HubTile = {
  id: string;
  title: string;
  count: number;
  subtitle: string;
  href: string;
};

type HubResponse = {
  headline?: string;
  tiles: HubTile[];
};

type SyncPullResponse = {
  unchanged: boolean;
  revision: string;
  serverTime: string;
  syncIntervalMs: number;
  language?: string;
  hub?: HubResponse;
};

type Props = NativeStackScreenProps<RootStackParamList, "Hub"> & { onLogout: () => void };

const routeMap: Record<string, keyof RootStackParamList> = {
  clients: "Clients",
  finance: "Finance",
  payments: "Finance",
  tax: "Tax",
  "tax-compliance": "Tax",
  properties: "WebSection",
  tenants: "WebSection",
  settings: "Settings",
  operations: "WebSection",
};

export function HubScreen({ navigation, onLogout }: Props) {
  const [hub, setHub] = useState<HubResponse | null>(null);
  const [userLabel, setUserLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncLabel, setSyncLabel] = useState("");
  const revisionRef = useRef<string | null>(null);

  const applyLocale = useCallback(async (apiLang?: string | null) => {
    if (!apiLang) return;
    const locale = apiToLocale(apiLang);
    await SecureStore.setItemAsync(LOCALE_KEY, locale);
  }, []);

  const pullSync = useCallback(async (token: string) => {
    const rev = revisionRef.current ?? (await SecureStore.getItemAsync(REVISION_KEY));
    const qs = rev ? `?revision=${encodeURIComponent(rev)}` : "";
    const data = await apiRequest<SyncPullResponse>(`/sync/pull${qs}`, {}, token);
    revisionRef.current = data.revision;
    await SecureStore.setItemAsync(REVISION_KEY, data.revision);
    setSyncLabel(new Date(data.serverTime).toLocaleTimeString());
    if (data.language) await applyLocale(data.language);
    if (!data.unchanged && data.hub) setHub(data.hub);
  }, [applyLocale]);

  const loadHub = useCallback(async () => {
    const token = await SecureStore.getItemAsync("access");
    const userJson = await SecureStore.getItemAsync("user");
    if (userJson) {
      try {
        const u = JSON.parse(userJson) as { email?: string; role?: string };
        setUserLabel(`${u.email ?? "User"} · ${u.role ?? ""}`);
      } catch {
        /* ignore */
      }
    }
    if (!token) return;

    connectRealtime(token, () => {
      void pullSync(token).catch(() => null);
    });

    try {
      const data = await apiRequest<SyncPullResponse>("/sync/pull", {}, token);
      revisionRef.current = data.revision;
      await SecureStore.setItemAsync(REVISION_KEY, data.revision);
      if (data.language) await applyLocale(data.language);
      if (data.hub) setHub(data.hub);
      else {
        const fallback = await apiRequest<HubResponse>("/dashboard/hub", {}, token);
        setHub(fallback);
      }
      setSyncLabel(new Date(data.serverTime).toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, [applyLocale, pullSync]);

  useEffect(() => {
    loadHub();
    const id = setInterval(() => {
      SecureStore.getItemAsync("access").then((token) => {
        if (token) void pullSync(token).catch(() => null);
      });
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadHub, pullSync]);

  const openTile = (tile: HubTile) => {
    const key = routeMap[tile.id] ?? "WebSection";
    if (key === "WebSection") {
      navigation.navigate("WebSection", { title: tile.title, path: tile.href });
      return;
    }
    navigation.navigate(key);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#0f172a" }}>{hub?.headline ?? "Dashboard"}</Text>
        <Text style={{ color: "#64748b", marginBottom: 4 }}>{userLabel}</Text>
        {syncLabel ? (
          <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>Synced {syncLabel}</Text>
        ) : null}

        {loading ? (
          <ActivityIndicator />
        ) : (
          <View style={{ gap: 12 }}>
            {(hub?.tiles ?? []).map((tile) => (
              <Pressable
                key={tile.id}
                onPress={() => openTile(tile)}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "600", color: "#0f172a" }}>{tile.title}</Text>
                <Text style={{ fontSize: 28, fontWeight: "700", marginTop: 4 }}>{tile.count}</Text>
                <Text style={{ color: "#64748b", marginTop: 4 }}>{tile.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <Button title="Sign out" onPress={onLogout} color="#64748b" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export async function getStoredLocale(): Promise<AppLocale> {
  const raw = await SecureStore.getItemAsync(LOCALE_KEY);
  const allowed: AppLocale[] = ["en", "fr", "rw", "sw", "es", "nl", "zh"];
  return allowed.includes(raw as AppLocale) ? (raw as AppLocale) : "en";
}

export async function saveLocale(locale: AppLocale, token?: string) {
  await SecureStore.setItemAsync(LOCALE_KEY, locale);
  if (token) {
    await apiRequest("/auth/me/language", {
      method: "PATCH",
      body: JSON.stringify({ language: localeToApi(locale) }),
    }, token);
  }
}
