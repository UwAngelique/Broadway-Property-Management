import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import { clearSession, logoutServer } from "./src/session";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HubScreen } from "./src/screens/HubScreen";
import { ClientsScreen } from "./src/screens/ClientsScreen";
import { FinanceScreen } from "./src/screens/FinanceScreen";
import { TaxScreen } from "./src/screens/TaxScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { WebSectionScreen } from "./src/screens/WebSectionScreen";
import type { RootStackParamList } from "./src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("access").then((t) => {
      setLoggedIn(!!t);
      setReady(true);
    });
  }, []);

  const logout = async () => {
    await logoutServer();
    await clearSession();
    setLoggedIn(false);
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!loggedIn ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={() => setLoggedIn(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Hub">
              {(props) => <HubScreen {...props} onLogout={logout} />}
            </Stack.Screen>
            <Stack.Screen name="Clients" component={ClientsScreen} />
            <Stack.Screen name="Finance" component={FinanceScreen} />
            <Stack.Screen name="Tax" component={TaxScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="WebSection" component={WebSectionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
