import React from 'react';
import { View, Text, Image, Pressable, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

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
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`mx-auto flex h-auto w-[360px] flex-1 flex-col items-center justify-center px-6 ${isDark ? 'bg-[#0B0E11]' : 'bg-transparent'}`}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="mt-6 h-[20px] w-[328px] flex-row items-center justify-between ">
        <View className="h-[4px] w-[52px] flex-row items-center gap-1">
          {Array.from({ length: totalScreens }).map((_, i) => (
            <View
              key={i}
              className={`h-[4px] w-[20px] rounded-[40px] ${
                i === currentIndex
                  ? 'bg-button-buttonBG'
                  : isDark
                    ? 'bg-button-buttonDisabledBG'
                    : 'bg-button-buttonLight'
              }`}
            />
          ))}
        </View>

        <Pressable onPress={onSkip}>
          <Text
            className={`text-sm font-semibold ${
              isDark ? 'text-text-accentDark' : 'text-text-accentLight '
            }`}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      <View className="h-[326px] w-[333px] flex-col items-center justify-center">
        <Image source={require('@/assets/images/heroImage.png')} className="relative" />
      </View>

      <View className="mt-6 flex h-auto w-[328px] flex-col items-center justify-center  gap-[34px] py-4 ">
        <View className="flex flex-col items-center justify-center ">
          <Text
            className={`tex-center w-[276px] text-center text-[32px] font-bold ${
              isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'
            }`}
          >
            Your Path to Better {'\n'} Health Starts With {'\n'} Cyberclinics
          </Text>
          <Text
            className={`mt-3 w-[328px] text-center text-[16px] leading-8 ${
              isDark ? 'text-text-secondaryDark' : 'text-text-secondaryLight'
            }`}
          >
            Your personal AI health companion that answers all your health related questions
          </Text>
        </View>

        <View className="mb-6 flex w-[328px] flex-col gap-4 space-y-4  ">
          <Pressable
            onPress={onSignup}
            className="rounded-full bg-button-buttonBG py-4 active:opacity-80 "
          >
            <Text
              className={`text-center text-base font-semibold ${
                isDark ? 'text-text-textInverse' : 'text-text-buttonSecondaryTextLight'
              }`}
            >
              Get Started With Cyberclinics
            </Text>
          </Pressable>

          <Pressable
            onPress={onSignIn}
            className={`rounded-full py-4 ${
              isDark ? 'bg-button-buttonSecondaryDark' : 'bg-button-buttonSecondaryLight'
            } active:opacity-80`}
          >
            <Text
              className={`text-center text-base font-semibold ${
                isDark ? 'text-text-buttonSecondaryText' : 'text-text-buttonSecondaryText'
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
