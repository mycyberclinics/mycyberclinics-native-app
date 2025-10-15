import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  useColorScheme,
  useWindowDimensions,
  ScrollView,
  Platform,
} from 'react-native';
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
  const { width } = useWindowDimensions();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Platform.OS === 'web' ? 60 : 20,
      }}
    >
      <View
        className={`flex flex-1 flex-col items-center justify-center px-6 ${
          isDark ? 'bg-[#0B0E11]' : 'bg-transparent'
        }`}
        style={{
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
        }}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <View className=" h-[20px] w-full max-w-[328px] flex-row items-center justify-between">
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
                isDark ? 'text-text-accentDark' : 'text-text-accentLight'
              }`}
            >
              Skip
            </Text>
          </Pressable>
        </View>

        <View className="mt-4 flex h-auto w-full max-w-[313px] flex-col items-center justify-center">
          <Image
            source={require('@/assets/images/heroImage.png')}
            className="relative h-[326px] w-full object-contain"
            resizeMode="contain"
          />
        </View>

        <View className=" flex h-auto w-full max-w-[328px] flex-col items-center justify-center gap-[34px] py-4">
          <View className="flex flex-col items-center justify-center">
            <Text
              className={`w-[320px] text-center text-[28px] font-bold md:text-[32px] ${
                isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'
              }`}
              style={{ maxWidth: 340 }}
            >
              Your Path to Better Health Starts With Cyberclinics
            </Text>

            <Text
              className={`mt-3 text-center text-[16px] leading-7 ${
                isDark ? 'text-text-secondaryDark' : 'text-text-secondaryLight'
              }`}
              style={{ maxWidth: 340 }}
            >
              Your personal AI health companion that answers all your health related questions
            </Text>
          </View>

          <View className="flex flex-col w-full gap-4 mb-6">
            <Pressable
              onPress={onSignup}
              className="py-4 rounded-full bg-button-buttonBG active:opacity-80"
              style={{
                minWidth: width > 480 ? 300 : '100%',
              }}
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
              style={{
                minWidth: width > 480 ? 300 : '100%',
                backgroundColor: '#D1FAE5',
              }}
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
    </ScrollView>
  );
}
