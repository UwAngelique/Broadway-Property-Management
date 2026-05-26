import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiRequest } from "../api";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Clients">;

export function ClientsScreen({ navigation }: Props) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("access");
      if (!token) return;
      try {
        setData(await apiRequest("/platform/overview", {}, token));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }} onPress={() => navigation.goBack()}>
          ← Clients
        </Text>
        {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
        {!data && !error ? <ActivityIndicator /> : null}
        <Text style={{ fontFamily: "monospace", fontSize: 11 }}>{data ? JSON.stringify(data, null, 2).slice(0, 4000) : ""}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
