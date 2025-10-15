import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import Carousel, { type ICarouselInstance } from 'react-native-reanimated-carousel';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import OnboardingScreen from '@/app/(onboarding)/index';
import OnboardingScreen2 from '@/app/(onboarding)/onboardingScreen2';
import OnboardingScreen3 from '@/app/(onboarding)/onboardingScreen3';

type ScreenProps = {
  onNext: () => void;
  onSkip: () => void;
  onSignIn: () => void;
  onSignup: () => void;
  currentIndex: number;
  totalScreens: number;
};

type ScreenItem = {
  key: string;
  render: (p: ScreenProps) => React.ReactElement;
};

export default function OnboardingCarousel() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const carouselRef = useRef<ICarouselInstance>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { bottom } = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useSharedValue(0);

  const goToSignIn = () => {
    setTimeout(() => router.push('/(auth)/signIn'), 150);
  };
  const gotoSignup = () => router.push('/(auth)/signup/emailPassword');

  const screens = useMemo<ScreenItem[]>(
    () => [
      { key: '1', render: (p) => <OnboardingScreen {...p} /> },
      { key: '2', render: (p) => <OnboardingScreen2 {...p} /> },
      { key: '3', render: (p) => <OnboardingScreen3 {...p} /> },
    ],
    [],
  );

  const total = screens.length;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDark ? '#0B0E11' : '#FFFFFF',
        paddingTop: 0,
        paddingBottom: bottom,
      }}
      edges={['bottom']}
    >
      <Carousel
        ref={carouselRef}
        width={width}
        height={height}
        data={screens}
        loop={false}
        pagingEnabled
        autoPlay
        autoPlayInterval={6000}
        onSnapToItem={(idx: number) => setCurrentIndex(idx)}
        onProgressChange={(_: number, absoluteProgress: number) => {
          progress.value = absoluteProgress;
        }}
        renderItem={({ item, index }: { item: ScreenItem; index: number }) => (
          <CarouselSlide
            item={item}
            index={index}
            total={total}
            isDark={isDark}
            progress={progress}
            carouselRef={carouselRef}
            goToSignIn={goToSignIn}
            gotoSignup={gotoSignup}
            currentIndex={currentIndex}
          />
        )}
      />
    </SafeAreaView>
  );
}

function CarouselSlide({
  item,
  index,
  total,
  isDark,
  progress,
  carouselRef,
  goToSignIn,
  gotoSignup,
  currentIndex,
}: {
  item: { key: string; render: (p: ScreenProps) => React.ReactElement };
  index: number;
  total: number;
  isDark: boolean;
  progress: SharedValue<number>;
  carouselRef: React.RefObject<ICarouselInstance | null>;
  goToSignIn: () => void;
  gotoSignup: () => void;
  currentIndex: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(progress.value - index);
    const opacity = withTiming(interpolate(distance, [0, 1], [1, 0.3], Extrapolation.CLAMP), {
      duration: 500,
      easing: Easing.out(Easing.quad),
    });
    const scale = withTiming(interpolate(distance, [0, 1], [1, 0.95], Extrapolation.CLAMP), {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    return { opacity, transform: [{ scale }] };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: 60,
          backgroundColor: isDark ? '#0B0E11' : '#FFFFFF',
        }}
        showsVerticalScrollIndicator={false}
      >
        {item.render({
          onNext: () => {
            if (index < total - 1) {
              carouselRef.current?.scrollTo({ index: index + 1, animated: true });
            } else {
              goToSignIn();
            }
          },
          onSkip: goToSignIn,
          onSignIn: goToSignIn,
          onSignup: gotoSignup,
          currentIndex,
          totalScreens: total,
        })}
      </ScrollView>
    </Animated.View>
  );
}
