import { Button, Linking, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import { getPrivacyUrl, getTermsUrl } from "../config";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export function SettingsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 16 }} onPress={() => navigation.goBack()}>
          ← Settings
        </Text>
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
