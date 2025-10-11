import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingScreen from '@/app/(onboarding)/index';
import OnboardingScreen2 from '@/app/(onboarding)/onboardingScreen2';
import OnboardingScreen3 from '@/app/(onboarding)/onboardingScreen3';

const { width } = Dimensions.get('window');

export default function OnboardingCarousel() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goToSignIn = () => router.replace('/(auth)/signIn');
  const gotoSignup = () => router.replace('/(auth)/signup');

  type ScreenProps = {
    onNext: () => void;
    onSkip: () => void;
    onSignIn: () => void;
    onSignup: () => void;
    currentIndex: number;
    totalScreens: number;
  };

  const screens = [
    {
      key: '1',
      component: (props: ScreenProps) => <OnboardingScreen {...props} />,
    },
    {
      key: '2',
      component: (props: ScreenProps) => <OnboardingScreen2 {...props} />,
    },
    {
      key: '3',
      component: (props: ScreenProps) => <OnboardingScreen3 {...props} />,
    },
  ];

  const goToNext = useCallback(
    (index: number) => {
      if (index < screens.length) {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        setCurrentIndex(index);
      } else {
        router.replace('/(auth)/signIn');
      }
    },
    [screens.length, router],
  );

  useEffect(() => {
    // advances except for the last screen
    if (currentIndex < screens.length - 1) {
      const interval = setInterval(() => {
        goToNext(currentIndex + 1);
      }, 5000); //change back to 5 secs later
      return () => clearInterval(interval);
    }
    // no timer on the last screen, so no advancement
    return undefined;
  }, [currentIndex, goToNext, screens.length]);


  return (
    <View className="items-center justify-center flex-1">
      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={({ item, index }) => (
          <View style={{ width }}>
            {item.component({
              onNext: () => goToNext(index + 1),
              onSkip: goToSignIn,
              onSignIn: goToSignIn,
              onSignup: gotoSignup,
              currentIndex,
              totalScreens: screens.length,
            })}
          </View>
        )}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialScrollIndex={0}
      />
    </View>
  );
}
