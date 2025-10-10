import React from 'react';
import { View, Text, Image, useColorScheme, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';

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

      <View className="mx-auto mt-10 flex h-auto w-[312px] max-w-full flex-col items-center justify-center gap-2 ">
        <View className="relative mx-auto w-full ">
          <View className="absolute left-3 top-[60%] z-10 h-[66px] w-[288px] rounded-[12px] bg-misc-emptyView2"></View>
          <View className="absolute left-1.5 top-[53%] z-20 h-[69px] w-[300px] rounded-[12px] bg-misc-emptyView1 "></View>
          <View className="relative z-30 h-auto w-full">
            <View className="absolute right-[5%] top-[-12%] z-40 h-[28px] w-[158px] rounded-[36px] border border-misc-borderColor bg-emerald-700 px-[6px] py-[4px]">
              <Text className="text-text-primaryDark ">✨ Your AI Companion</Text>
            </View>
            <View
              className={`flex h-[132px] w-[312px] flex-row items-start justify-center gap-4  px-4 py-8 ${isDark ? 'bg-button-buttonDisabledBG' : 'bg-card-cardBGLight'} border ${isDark ? 'border-card-cardBG' : 'border-card-cardBorder'}  rounded-[12px] `}
            >
              <View className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-image-imageBG ">
                <Image
                  className="h-[39px] w-[23px] rounded-full "
                  source={require('@/assets/images/chioma1.png')}
                />
              </View>
              <Text
                className={`${isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'} h-[80px] w-[244px] text-[14px] font-[400] leading-[20px] `}
              >
                Hi, I’m Chioma 👋, how are you feeling today? I can help you track your heart rate,
                book appointments, or even answer your health questions.
              </Text>
            </View>
          </View>
        </View>
        <View className="mt-10 flex h-auto w-full flex-row items-center gap-2">
          <View className="flex flex-1 flex-col items-end justify-center gap-6 px-0 ">
            <Text
              className={`h-[50px] w-[154px] rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] p-[16px] ${isDark ? 'bg-card-cardBG' : 'bg-card-cardBGLight'} ${isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'} `}
            >
              Check my vitals 💓
            </Text>
            <Text
              style={{
                shadowColor: 'rgba(30, 210, 138, 0.4)',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 1,
                shadowRadius: 6,
                elevation: 12,
              }}
              className={`h-[51px] w-[210px] rounded-bl-[12px] rounded-br-[12px] rounded-tl-[12px] p-[16px] ${isDark ? 'bg-card-cardBG' : 'bg-card-cardBGLight'} ${isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'} shadow-boxShadow-green-soft `}
            >
              Remind me to take meds 💊
            </Text>
          </View>
          <Image
            className="h-[40px] w-[40px] rounded-full "
            source={require('@/assets/images/patient1.png')}
          />
        </View>
      </View>

      <View className="my-6 flex h-auto w-[328px] flex-col items-center justify-center gap-[34px] py-4 ">
        <View className="flex w-full flex-col items-center justify-center gap-4">
          <Text
            className={`tex-center w-full text-center text-[32px] font-bold ${
              isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'
            }`}
          >
            Say Hello To Chioma,{'\n'}Your AI Assistant
          </Text>
          <Text
            className={`mt-3 h-[48px] w-[328px] text-center text-[16px] leading-8 ${
              isDark ? 'text-text-secondaryDark' : 'text-text-secondaryLight'
            }`}
          >
            Your personal AI health companion that answers all your health related questions
          </Text>
        </View>

        <View className="mb-6 mt-6 flex w-[328px] flex-col gap-4  space-y-4">
          <Pressable
            onPress={onNext}
            className="rounded-full bg-button-buttonBG py-4 active:opacity-80 "
          >
            <Text
              className={`text-center text-base font-semibold ${
                isDark ? 'text-text-textInverse' : 'text-text-buttonSecondaryTextLight'
              }`}
            >
              Continue
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
