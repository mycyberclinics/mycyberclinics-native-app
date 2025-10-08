import React from "react";
import {
  View,
  Text,
  Image,
  useColorScheme,
  Pressable,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";

type ScreenProps = {
  onNext: () => void;
  onSkip: () => void;
  onSignIn: () => void;
  currentIndex: number;
  totalScreens: number;
};

export default function OnboardingScreen2({
  onNext,
  onSignIn,
  onSkip,
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

      
      <View className="flex flex-col items-center justify-center max-w-full gap-2 w-[312px] h-auto mx-auto mt-10 ">
        <View className="relative w-full mx-auto ">
          <View className="absolute z-10 bg-misc-emptyView2 top-[60%] left-3 w-[288px] h-[66px] rounded-[12px]"></View>
          <View className="absolute top-[53%] left-1.5 z-20 bg-misc-emptyView1 w-[300px] h-[69px] rounded-[12px] "></View>
          <View className="relative z-30 w-full h-auto">
            <View className="absolute z-40 top-[-12%] right-[5%] bg-emerald-700 w-[158px] h-[28px] rounded-[36px] py-[4px] px-[6px] border border-misc-borderColor">
              <Text className="text-text-primaryDark ">
                ✨ Your AI Companion
              </Text>
            </View>
            <View
              className={`flex flex-row items-start justify-center gap-4 w-[312px] h-[132px]  py-8 px-4 ${isDark ? "bg-button-buttonDisabledBG" : "bg-card-cardBGLight"} border ${isDark ? "border-card-cardBG" : "border-card-cardBorder"}  rounded-[12px] `}
            >
              <View className="w-[42px] h-[42px] rounded-full bg-image-imageBG flex items-center justify-center ">
                <Image
                  className="w-[23px] h-[39px] rounded-full "
                  source={require("@/assets/images/chioma1.png")}
                />
              </View>
              <Text
                className={`${isDark ? "text-text-primaryDark" : "text-text-primaryLight"} w-[244px] h-[80px] text-[14px] leading-[20px] font-[400] `}
              >
                Hi, I’m Chioma 👋, how are you feeling today? I can help you
                track your heart rate, book appointments, or even answer your
                health questions.
              </Text>
            </View>
          </View>
        </View>
        <View className="flex flex-row items-center w-full h-auto gap-2 mt-10">
          <View className="flex flex-col items-end justify-center flex-1 gap-6 px-0 ">
            <Text
              className={`w-[154px] h-[50px] rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[12px] p-[16px] ${isDark ? "bg-card-cardBG" : "bg-card-cardBGLight"} ${isDark ? "text-text-primaryDark" : "text-text-primaryLight"} `}
            >
              Check my vitals 💓
            </Text>
            <Text
              style={{
                shadowColor: "rgba(30, 210, 138, 0.4)",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 1,
                shadowRadius: 6,
                elevation: 12,
              }}
              className={`w-[210px] h-[51px] rounded-tl-[12px] rounded-br-[12px] rounded-bl-[12px] p-[16px] ${isDark ? "bg-card-cardBG" : "bg-card-cardBGLight"} ${isDark ? "text-text-primaryDark" : "text-text-primaryLight"} shadow-boxShadow-green-soft `}
            >
              Remind me to take meds 💊
            </Text>
          </View>
          <Image
            className="w-[40px] h-[40px] rounded-full "
            source={require("@/assets/images/patient1.png")}
          />
        </View>
      </View>

      
      <View className="flex flex-col items-center justify-center my-6 w-[328px] h-auto gap-[34px] py-4 ">
        <View className="flex flex-col items-center justify-center w-full gap-4">
          <Text
            className={`w-full text-[32px] tex-center font-bold text-center ${
              isDark ? "text-text-primaryDark" : "text-text-primaryLight"
            }`}
          >
            Say Hello To Chioma,{"\n"}Your AI Assistant
          </Text>
          <Text
            className={`w-[328px] h-[48px] text-[16px] text-center mt-3 leading-8 ${
              isDark ? "text-text-secondaryDark" : "text-text-secondaryLight"
            }`}
          >
            Your personal AI health companion that answers all your health
            related questions
          </Text>
        </View>

        <View className="flex flex-col gap-4 w-[328px] mb-6 space-y-4  mt-6">
          <Pressable
            onPress={onNext}
            className="py-4 rounded-full bg-button-buttonBG active:opacity-80 "
          >
            <Text
              className={`text-center font-semibold text-base ${
                isDark
                  ? "text-text-textInverse"
                  : "text-text-buttonSecondaryTextLight"
              }`}
            >
              Continue
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
