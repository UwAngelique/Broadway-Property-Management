import { useCallback, useEffect, useState } from "react";
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
import { apiRequest } from "../api";
import { connectRealtime } from "../realtime";
import type { RootStackParamList } from "../navigation/types";

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
      apiRequest<HubResponse>("/dashboard/hub", {}, token).then(setHub).catch(() => null);
    });
    try {
      const data = await apiRequest<HubResponse>("/dashboard/hub", {}, token);
      setHub(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHub();
  }, [loadHub]);

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
        <Text style={{ color: "#64748b", marginBottom: 16 }}>{userLabel}</Text>

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
                <Text style={{ fontSize: 28, fontWeight: "700", color: "#059669", marginVertical: 4 }}>{tile.count}</Text>
                <Text style={{ color: "#64748b", fontSize: 13 }}>{tile.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ marginTop: 24, gap: 8 }}>
          <Button title="Settings" onPress={() => navigation.navigate("Settings")} />
          <Button title="Sign out" onPress={onLogout} color="#64748b" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
