import { Button, Linking, SafeAreaView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "WebSection">;

export function WebSectionScreen({ route, navigation }: Props) {
  const url = `http://broadwaycreation.rw${route.params.path.startsWith("/") ? route.params.path : `/${route.params.path}`}`;

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: "#f8fafc" }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 8 }} onPress={() => navigation.goBack()}>
        ← {route.params.title}
      </Text>
      <Text style={{ color: "#64748b", marginBottom: 16 }}>
        This section is fully available in the web app. Open it in your browser (sign in with the same account).
      </Text>
      <Button title="Open in browser" onPress={() => Linking.openURL(url)} color="#0f172a" />
      <View style={{ marginTop: 12 }}>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}
