import React from 'react';
import { View, Text, Image, Pressable, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ButtonComponent from '@/components/ButtonComponent';

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
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(width, 480);

  return (
    <View
      className="flex-1 items-center justify-center bg-transparent px-6 dark:bg-[#0B0E11]"
      style={{
        width: '100%',
        maxWidth,
        alignSelf: 'center',
      }}
    >
      <StatusBar style="auto" />

      {/* progress bar + skip */}
      <View className="h-[20px] w-full flex-row items-center justify-between">
        <View className="h-[4px] flex-row items-center gap-1">
          {Array.from({ length: totalScreens }).map((_, i) => (
            <View
              key={i}
              className={`h-[4px] w-[20px] rounded-[40px] ${
                i === currentIndex
                  ? 'bg-button-buttonBG'
                  : 'bg-button-buttonLight dark:bg-button-buttonDisabledBG'
              }`}
            />
          ))}
        </View>

        <Pressable onPress={onSkip}>
          <Text className="text-sm font-semibold text-text-accentLight dark:text-text-accentDark">
            Skip
          </Text>
        </Pressable>
      </View>

      <View className="relative mt-10 w-full max-w-[360px] flex-col items-center justify-center gap-4">
        <View className="relative items-center justify-center w-full">
          <View className="left-4.5 absolute top-[58%] h-[66px] w-[296px] rounded-[12px] bg-misc-emptyView2 md:w-[336px]" />
          <View className="absolute left-2 top-[52%] h-[69px] w-[318px] rounded-[12px] bg-misc-emptyView1 md:w-[354px]" />

          <View className="relative z-30 flex w-full flex-row items-start justify-center gap-4 rounded-[12px] border border-card-cardBorder bg-card-cardBGLight px-4 py-8 dark:border-card-cardBG dark:bg-button-buttonDisabledBG">
            <View className="flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full bg-image-imageBG">
              <Image
                source={require('@/assets/images/chioma1.png')}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  resizeMode: 'contain',
                }}
              />
            </View>
            <Text className="w-[244px] text-[14px] font-[400] leading-[20px] text-text-primaryLight dark:text-text-primaryDark">
              Hi, I’m Chioma 👋, how are you feeling today? I can help you track your heart rate,
              book appointments, or even answer your health questions.
            </Text>
          </View>

          <View className="absolute right-[5%] top-[-14%] z-40 h-[28px] min-w-[158px] items-center justify-center rounded-[36px] border border-misc-borderColor bg-emerald-700 px-[6px] py-[4px]">
            <Text className="text-[12px] font-semibold text-white">✨ Your AI Companion</Text>
          </View>
        </View>

        <View className="flex flex-row items-center justify-end w-full gap-2 mt-10">
          <View className="flex flex-col items-end justify-center flex-1 gap-4">
            <Text className="rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] bg-card-cardBGLight p-[16px] text-text-primaryLight dark:bg-card-cardBG dark:text-text-primaryDark">
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
              className="rounded-bl-[12px] rounded-br-[12px] rounded-tl-[12px] bg-card-cardBGLight p-[16px] text-text-primaryLight dark:bg-card-cardBG dark:text-text-primaryDark"
            >
              Remind me to take meds 💊
            </Text>
          </View>

          <View className="h-[40px] w-[40px] overflow-hidden rounded-full">
            <Image
              source={require('@/assets/images/patient1.png')}
              style={{ width: 40, height: 40, borderRadius: 20, resizeMode: 'cover' }}
            />
          </View>
        </View>
      </View>

      <View className="my-6 flex w-full flex-col items-center justify-center gap-[34px] py-4">
        <View className="flex flex-col items-center justify-center w-full gap-4">
          <Text className="text-center text-[28px] font-bold text-text-primaryLight sm:text-[32px] dark:text-text-primaryDark">
            Say Hello To Chioma,{'\n'}Your AI Assistant
          </Text>
          <Text className="mt-2 w-[320px] text-center text-[15px] leading-6 text-text-secondaryLight dark:text-text-secondaryDark">
            Your personal AI health companion that answers all your health related questions.
          </Text>
        </View>

        <View className="flex flex-col w-full gap-4 mt-4 mb-6">
          <ButtonComponent
            title="Continue"
            onPress={onNext}
            style={{
              minWidth: width > 480 ? 300 : '100%',
            }}
          />

          <ButtonComponent
            title="Sign In"
            onPress={onSignIn}
            style={{
              minWidth: width > 480 ? 300 : '100%',
              backgroundColor: '#D1FAE5',
              borderColor: '#A7F3D0',
            }}
            textStyle={{
              color: '#047857',
            }}
          />
        </View>
      </View>
    </View>
  );
}
