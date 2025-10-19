import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  useWindowDimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ButtonComponent from '@/components/ButtonComponent';

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
        className="flex flex-1 flex-col items-center justify-center bg-transparent px-6 dark:bg-[#0B0E11]"
        style={{
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
        }}
      >
        <StatusBar style="auto" />


        <View className="h-[20px] w-full max-w-[328px] flex-row items-center justify-between">
          <View className="h-[4px] w-[52px] flex-row items-center gap-1">
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

        <View className="mt-4 flex h-auto w-full max-w-[313px] flex-col items-center justify-center">
          <Image
            source={require('@/assets/images/heroImage.png')}
            className="relative h-[326px] w-full object-contain"
            resizeMode="contain"
          />
        </View>

        <View className="flex h-auto w-full max-w-[328px] flex-col items-center justify-center gap-[34px] py-4">
          <View className="flex flex-col items-center justify-center">
            <Text
              className="w-[320px] text-center text-[28px] font-bold text-text-primaryLight md:text-[32px] dark:text-text-primaryDark"
              style={{ maxWidth: 340 }}
            >
              Your Path to Better Health Starts With Cyberclinics
            </Text>

            <Text
              className="mt-3 text-center text-[16px] leading-7 text-text-secondaryLight dark:text-text-secondaryDark"
              style={{ maxWidth: 340 }}
            >
              Your personal AI health companion that answers all your health related questions
            </Text>
          </View>


          <View className="flex flex-col w-full gap-4 mb-6">

            <ButtonComponent
              title="Get Started With Cyberclinics"
              onPress={onSignup}
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
