import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiRequest } from "../api";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Finance">;

export function FinanceScreen({ navigation }: Props) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("access");
      const userJson = await SecureStore.getItemAsync("user");
      if (!token || !userJson) return;
      const user = JSON.parse(userJson) as { role?: string };
      try {
        if (user.role === "PLATFORM_OWNER") {
          setData(await apiRequest("/platform/finance", {}, token));
        } else {
          const [payments, invoices] = await Promise.all([
            apiRequest("/payments", {}, token),
            apiRequest("/payments/invoices", {}, token),
          ]);
          setData({ payments, invoices });
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }} onPress={() => navigation.goBack()}>
          ← Finance
        </Text>
        {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
        {!data && !error ? <ActivityIndicator /> : null}
        <Text style={{ fontFamily: "monospace", fontSize: 11 }}>{data ? JSON.stringify(data, null, 2).slice(0, 4000) : ""}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
