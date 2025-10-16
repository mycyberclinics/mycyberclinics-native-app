import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  useColorScheme,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

type ScreenProps = {
  onNext: () => void;
  onSkip: () => void;
  onSignIn: () => void;
  currentIndex: number;
  totalScreens: number;
};

export default function OnboardingScreen({
  onNext,
  onSignIn,
  onSkip,
  currentIndex,
  totalScreens,
}: ScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();

  const gradientColors =
    colorScheme === 'dark'
      ? (['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.7)', 'transparent'] as const)
      : (['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)', 'transparent'] as const);

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
        className={` mb-10 flex flex-1 flex-col items-center justify-center px-6 ${
          isDark ? 'bg-[#0B0E11]' : 'bg-transparent'
        }`}
        style={{
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
        }}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <View
          className={` w-full max-w-[328px] flex-row items-center justify-between ${isDark ? 'bg-transparent' : 'bg-transparent'}`}
        >
          <View className="flex-row items-center gap-1">
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

        <View className="mt-16 h-auto w-full max-w-[328px] flex-col items-center justify-center">
          <Image
            source={require('@/assets/images/onboarding1.png')}
            className="relative h-[250px] w-[250px] object-contain"
            resizeMode="contain"
          />
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            className="absolute bottom-[0%] left-[14%] h-[100px] w-[238px] md:w-full "
          />
          <Image
            source={require('@/assets/images/onboarding2.png')}
            className="absolute bottom-[-42%] left-[50%]"
            resizeMode="contain"
          />
        </View>

        <View className="mt-14 flex w-full max-w-[328px] flex-col items-center justify-center gap-[34px] py-4">
          <View className="flex flex-col items-center justify-center">
            <Text
              className={`text-center text-[28px] font-bold md:text-[32px] ${
                isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'
              }`}
            >
              Get Healthcare,{'\n'}Wherever You Are
            </Text>
            <Text
              className={`mt-3 text-center text-[16px] leading-5 ${
                isDark ? 'text-text-secondaryDark' : 'text-text-secondaryLight'
              }`}
              style={{
                maxWidth: 340,
              }}
            >
              Licensed doctors and specialists are just a tap away, from the comfort of your home.
            </Text>
          </View>

          <View className=" flex w-full max-w-[328px] flex-col gap-6">
            <Pressable
              onPress={onNext}
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
                Continue
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
