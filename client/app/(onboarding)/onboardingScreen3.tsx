import React from "react";
import { View, Text, Image, Pressable, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";

type ScreenProps = {
  onNext: () => void;
  onSkip: () => void;
  onSignIn: () => void;
  onSignup: () => void;
  currentIndex: number;
  totalScreens: number;
};

export default function OnboardingScreen3({
  onNext,
  onSignIn,
  onSkip,
  onSignup,
  currentIndex,
  totalScreens,
}: ScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className={`flex flex-col items-center justify-center flex-1 px-6 w-[360px] h-auto mx-auto ${isDark ? "bg-[#0B0E11]" : "bg-transparent"}`}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <View className="flex-row items-center justify-between mt-6 w-[328px] h-[20px] ">
        <View className="flex-row items-center gap-1 w-[52px] h-[4px]">
          {Array.from({ length: totalScreens }).map((_, i) => (
            <View
              key={i}
              className={`w-[20px] h-[4px] rounded-[40px] ${
                i === currentIndex
                  ? "bg-button-buttonBG"
                  : isDark
                    ? "bg-button-buttonDisabledBG"
                    : "bg-button-buttonLight"
              }`}
            />
          ))}
        </View>

        <Pressable onPress={onSkip}>
          <Text
            className={`text-sm font-semibold ${
              isDark ? "text-text-accentDark" : "text-text-accentLight "
            }`}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      <View className="flex-col items-center justify-center w-[333px] h-[326px]">
        <Image
          source={require("@/assets/images/heroImage.png")}
          className="relative"
        />
      </View>

      <View className="flex flex-col items-center justify-center mt-12 w-[328px] h-auto  gap-[34px] py-4 ">
        <View className="flex flex-col items-center justify-center ">
          <Text
            className={`w-[276px] text-[32px] tex-center font-bold text-center ${
              isDark ? "text-text-primaryDark" : "text-text-primaryLight"
            }`}
          >
            Your Path to Better {"\n"} Health Starts With {"\n"} Cyberclinics
          </Text>
          <Text
            className={`w-[328px] text-[16px] text-center mt-3 leading-8 ${
              isDark ? "text-text-secondaryDark" : "text-text-secondaryLight"
            }`}
          >
            Your personal AI health companion that answers all your health
            related questions
          </Text>
        </View>

        <View className="flex flex-col gap-6 w-[328px] mb-6 space-y-4  w-mt-auto">
          <Pressable
            onPress={onSignup}
            className="py-4 rounded-full bg-button-buttonBG active:opacity-80 "
          >
            <Text
              className={`text-center font-semibold text-base ${
                isDark
                  ? "text-text-textInverse"
                  : "text-text-buttonSecondaryTextLight"
              }`}
            >
              Get Started With Cyberclinics
            </Text>
          </Pressable>

          <Pressable
            onPress={onSignIn}
            className={`rounded-full py-4 ${
              isDark
                ? "bg-button-buttonSecondaryDark"
                : "bg-button-buttonSecondaryLight"
            } active:opacity-80`}
          >
            <Text
              className={`text-center font-semibold text-base ${
                isDark
                  ? "text-text-buttonSecondaryText"
                  : "text-text-buttonSecondaryText"
              }`}
            >
              Sign In
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
