import { Stack } from "expo-router";
import "../global.css";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useColorScheme, LogBox, View } from "react-native";
import { StatusBar } from "expo-status-bar";

// ignore Expo Router's internal warning
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // useEffect(() => {
  //   const prepare = async () => {
  //     try {
  //       await SplashScreen.preventAutoHideAsync();
  //       await new Promise((r) => setTimeout(r, 1000)); 
  //     } finally {
  //       await SplashScreen.hideAsync();
  //     }
  //   };
  //   prepare();
  // }, []);

  return (
    <SafeAreaProvider>
      <ThemedLayout colorScheme={colorScheme} />
    </SafeAreaProvider>
  );
}

function ThemedLayout({
  colorScheme,
}: {
  colorScheme: "light" | "dark" | null | undefined;
}) {
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  return (
    <View
      className={`flex-1 ${isDark ? "bg-[#0B0E11]" : "bg-white"}`}
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? "#0B0E11" : "#FFFFFF",
          },
        }}
      />
    </View>
  );
}
