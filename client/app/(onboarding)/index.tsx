import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import ButtonComponent from '@/components/ButtonComponent';

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
  const { width } = useWindowDimensions();

  // gradient adjusts automatically based on system theme
  const gradientColors = ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)', 'transparent'] as const;

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
        className="mb-10 flex flex-1 flex-col items-center justify-center bg-transparent px-6 dark:bg-[#0B0E11]"
        style={{
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
        }}
      >
        <StatusBar style="auto" />

        <View className="w-full max-w-[328px] flex-row items-center justify-between bg-transparent">
          <View className="flex-row items-center gap-1">
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

        {/* images + gradient overlay */}
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
            className="absolute bottom-[0%] left-[14%] h-[100px] w-[238px] md:w-full"
          />
          <Image
            source={require('@/assets/images/onboarding2.png')}
            className="absolute bottom-[-42%] left-[50%]"
            resizeMode="contain"
          />
        </View>

        <View className="mt-14 flex w-full max-w-[328px] flex-col items-center justify-center gap-[34px] py-4">
          <View className="flex flex-col items-center justify-center">
            <Text className="text-center text-[28px] font-bold text-text-primaryLight md:text-[32px] dark:text-text-primaryDark">
              Get Healthcare,{'\n'}Wherever You Are
            </Text>
            <Text
              className="mt-3 text-center text-[16px] leading-5 text-text-secondaryLight dark:text-text-secondaryDark"
              style={{ maxWidth: 340 }}
            >
              Licensed doctors and specialists are just a tap away, from the comfort of your home.
            </Text>
          </View>

          <View className="flex w-full max-w-[328px] flex-col gap-6">
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
    </ScrollView>
  );
}
