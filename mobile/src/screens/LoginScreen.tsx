import { useState } from "react";
import { Button, Linking, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiRequest } from "../api";
import { getPrivacyUrl, getTermsUrl } from "../config";

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: { id: number; email: string; role: string; accountId: number };
};

type Props = { onLogin: () => void };

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const persistSession = async (r: AuthResult) => {
    await SecureStore.setItemAsync("access", r.accessToken);
    await SecureStore.setItemAsync("refresh", r.refreshToken);
    await SecureStore.setItemAsync("user", JSON.stringify(r.user));
    onLogin();
  };

  const emailLogin = async () => {
    setError("");
    try {
      const r = await apiRequest<AuthResult>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await persistSession(r);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const sendOtp = async () => {
    setError("");
    try {
      await apiRequest("/auth/phone/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone, purpose: "LOGIN" }),
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const verifyOtp = async () => {
    setError("");
    try {
      const r = await apiRequest<AuthResult>("/auth/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, code: otp }),
      });
      await persistSession(r);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 26, fontWeight: "700", color: "#0f172a", marginBottom: 4 }}>Broadway PM</Text>
        <Text style={{ color: "#64748b", marginBottom: 20 }}>Property management for Rwanda</Text>

        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <Button title="Sign in" onPress={emailLogin} color="#0f172a" />

        <View style={{ marginTop: 28 }}>
          <Text style={styles.sectionTitle}>MTN / Airtel phone</Text>
          <TextInput placeholder="0781234567" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Button title="Send code" onPress={sendOtp} />
            </View>
          </View>
          <TextInput placeholder="6-digit code" value={otp} onChangeText={setOtp} style={styles.input} keyboardType="number-pad" />
          <Button title="Verify & sign in" onPress={verifyOtp} color="#0f172a" />
        </View>

        {error ? <Text style={{ color: "#dc2626", marginTop: 12 }}>{error}</Text> : null}

        <View style={{ marginTop: 24, flexDirection: "row", gap: 16 }}>
          <Pressable onPress={() => Linking.openURL(getPrivacyUrl())}>
            <Text style={styles.link}>Privacy</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(getTermsUrl())}>
            <Text style={styles.link}>Terms</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  sectionTitle: { fontWeight: "600" as const, marginBottom: 8, color: "#0f172a" },
  link: { color: "#2563eb", fontSize: 13 },
};
