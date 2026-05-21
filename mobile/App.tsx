import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiRequest, getApiUrl } from "./src/api";
import { connectRealtime } from "./src/realtime";

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: { id: number; email: string; role: string; accountId: number };
};

const Stack = createNativeStackNavigator();

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const emailLogin = async () => {
    try {
      const r = await apiRequest<AuthResult>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await SecureStore.setItemAsync("access", r.accessToken);
      await SecureStore.setItemAsync("refresh", r.refreshToken);
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const sendOtp = async () => {
    await apiRequest("/auth/phone/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  };

  const verifyOtp = async () => {
    try {
      const r = await apiRequest<AuthResult>("/auth/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, code: otp }),
      });
      await SecureStore.setItemAsync("access", r.accessToken);
      await SecureStore.setItemAsync("refresh", r.refreshToken);
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 12 }}>Broadway PM</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
      <Button title="Sign in" onPress={emailLogin} />
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontWeight: "600", marginBottom: 8 }}>MTN / Airtel (Rwanda)</Text>
        <TextInput placeholder="078..." value={phone} onChangeText={setPhone} style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
        <Button title="Send SMS code" onPress={sendOtp} />
        <TextInput placeholder="OTP" value={otp} onChangeText={setOtp} style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
        <Button title="Verify OTP" onPress={verifyOtp} />
      </View>
      {error ? <Text style={{ color: "red", marginTop: 12 }}>{error}</Text> : null}
      <Text style={{ marginTop: 16, fontSize: 12, color: "#666" }}>API: {getApiUrl()}</Text>
    </SafeAreaView>
  );
}

function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const [hub, setHub] = useState<unknown>(null);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("access");
      if (!token) return;
      connectRealtime(token, () => {
        apiRequest("/dashboard/hub", {}, token).then(setHub).catch(() => null);
      });
      apiRequest("/dashboard/hub", {}, token).then(setHub).catch(() => null);
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "600" }}>Dashboard</Text>
        <Text style={{ marginVertical: 8 }}>Synced with web via WebSocket + REST.</Text>
        <Text style={{ fontFamily: "monospace", fontSize: 11 }}>{JSON.stringify(hub, null, 2).slice(0, 2000)}</Text>
        <Button title="Sign out" onPress={onLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("access").then((t) => {
      setLoggedIn(!!t);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync("access");
    await SecureStore.deleteItemAsync("refresh");
    setLoggedIn(false);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {loggedIn ? (
          <Stack.Screen name="Dashboard">
            {() => <DashboardScreen onLogout={logout} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={() => setLoggedIn(true)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
