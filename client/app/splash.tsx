import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  useColorScheme,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useRouter } from "expo-router";

export default function Splash() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    let isMounted = true;

    async function runSplash() {
      try {
        await SplashScreen.preventAutoHideAsync();

        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
        ]).start();

        await new Promise((resolve) => setTimeout(resolve, 3000));

        if (isMounted) {
          await SplashScreen.hideAsync();
          router.replace("/(onboarding)");
        }
      } catch (error) {
        console.warn("Splash error:", error);
        await SplashScreen.hideAsync();
      }
    }

    runSplash();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View
      className={`flex-1 items-center justify-center ${
        isDark ? "bg-[#0B0E11]" : "bg-white"
      }`}
    >
      <Animated.View
        style={{
          opacity,
          transform: [{ scale }],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={require("@/assets/images/clinicLogo.png")}
          style={{ width: 160, height: 160 }}
          resizeMode="contain"
        />
      </Animated.View>
      <Text className="text-xl font-bold text-white ">
        Intelligent Telehealth Solutions
      </Text>
    </View>
  );
}
