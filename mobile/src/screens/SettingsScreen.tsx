import { useCallback, useEffect, useState } from "react";
import { Button, Linking, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { LOCALE_OPTIONS, translate, type AppLocale } from "../../shared/i18n";
import { getPrivacyUrl, getTermsUrl } from "../config";
import type { RootStackParamList } from "../navigation/types";
import { getStoredLocale, saveLocale } from "./HubScreen";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export function SettingsScreen({ navigation }: Props) {
  const [locale, setLocale] = useState<AppLocale>("en");

  useEffect(() => {
    getStoredLocale().then(setLocale);
  }, []);

  const onLocaleChange = useCallback(async (next: AppLocale) => {
    setLocale(next);
    const token = await SecureStore.getItemAsync("access");
    await saveLocale(next, token ?? undefined);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 16 }} onPress={() => navigation.goBack()}>
          ← {translate(locale, "nav.settings")}
        </Text>

        <Text style={{ fontWeight: "600", marginBottom: 8 }}>{translate(locale, "language.label")}</Text>
        <View style={{ marginBottom: 20, gap: 8 }}>
          {LOCALE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.locale}
              onPress={() => void onLocaleChange(opt.locale)}
              style={{
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: locale === opt.locale ? "#2563eb" : "#e2e8f0",
                backgroundColor: locale === opt.locale ? "#eff6ff" : "#fff",
              }}
            >
              <Text style={{ fontSize: 16, color: "#0f172a" }}>{translate(locale, opt.labelKey)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ marginBottom: 8, color: "#64748b" }}>
          App version {Constants.expoConfig?.version ?? "1.0.0"} ({Constants.expoConfig?.ios?.buildNumber ?? "1"})
        </Text>
        <Pressable onPress={() => Linking.openURL(getPrivacyUrl())} style={{ paddingVertical: 12 }}>
          <Text style={{ color: "#2563eb", fontSize: 16 }}>Privacy policy</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(getTermsUrl())} style={{ paddingVertical: 12 }}>
          <Text style={{ color: "#2563eb", fontSize: 16 }}>Terms of service</Text>
        </Pressable>
        <Text style={{ marginTop: 16, fontSize: 13, color: "#64748b" }}>
          For full workspace setup, team management, and billing, use the web dashboard at broadwaycreation.rw on desktop.
        </Text>
        <View style={{ marginTop: 16 }}>
          <Button title="Back to dashboard" onPress={() => navigation.navigate("Hub")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
