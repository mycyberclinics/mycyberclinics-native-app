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

  // start slightly small and invisible
  const opacity = useRef(new Animated.Value(0)).current; // 0 -> 1 -> 0
  const scale = useRef(new Animated.Value(0.92)).current; // 0.92 -> 1 -> 1.08

  // tiny helper to await animations
  const run = (anim: Animated.CompositeAnimation) =>
    new Promise<void>((resolve) => anim.start(() => resolve()));

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Keep native splash up until our sequence finishes
        await SplashScreen.preventAutoHideAsync();

        // entry fade-in + scale to 1.0
        await run(
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 700,
              easing: Easing.out(Easing.exp),
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              friction: 6,
              tension: 50,
              useNativeDriver: true,
            }),
          ])
        );

        // Hold for a beat so the logo is visible
        await new Promise((r) => setTimeout(r, 700));

        // exit fade-out + scale up slightly
        await run(
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 400,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.08,
              duration: 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        );

        if (!mounted) return;

        // Hide native splash, then navigate
        await SplashScreen.hideAsync();
        router.replace("/(onboarding)/onboardingCarousel");
      } catch (err: any) {
        // whether error or not, hide splash and move on
        await SplashScreen.hideAsync();
        router.replace("/(onboarding)/onboardingCarousel");
      }
    })();

    return () => {
      mounted = false;
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
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
        <Text
          className={`text-2xl font-800 ${isDark ? "text-text-primaryDark" : "text-text-primaryLight"} `}
        >
          Intelligent Telehealth Solutions
        </Text>
      </Animated.View>
    </View>
  );
}
