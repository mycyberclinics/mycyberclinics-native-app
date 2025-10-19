import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useColorScheme,
  Image,
  Alert,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getFirebaseAuth } from '@/lib/firebase';
import { sendEmailVerification, reload } from 'firebase/auth';
import { useAuthStore } from '@/store/auth';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTrackOnboardingStep } from '@/lib/hooks/useTrackOnboardingStep';
import ButtonComponent from '@/components/ButtonComponent';

const actionCodeSettings: import('firebase/auth').ActionCodeSettings = {
  url: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_DYNAMIC_LINK as string,
  handleCodeInApp: true,
  iOS: { bundleId: 'com.mycyberclinics.app' },
  android: { packageName: 'com.mycyberclinics.app', installApp: true },
};

export default function ConfirmEmailScreen() {
  const router = useRouter();
  useTrackOnboardingStep();

  const auth = getFirebaseAuth();
  const { user, loading, setLoading } = useAuthStore();

  const [resending, setResending] = useState(false);
  const [resendCooldownSec, setResendCooldownSec] = useState(0);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verified, setVerified] = useState<boolean>(!!user?.emailVerified);
  const [linkDetectedMessage, setLinkDetectedMessage] = useState<string | null>(null);

  const colorScheme = useColorScheme();

  // Button pulse animation
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!verified) {
      pulse.value = withRepeat(
        withTiming(1.03, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      try {
        cancelAnimation(pulse);
      } catch {}
      pulse.value = withTiming(1, { duration: 120 });
    }
  }, [verified, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // reload firebase user and check verification
  const reloadAndCheck = useCallback(async () => {
    try {
      setCheckingVerification(true);
      await reload(getFirebaseAuth().currentUser!);
      const refreshed = auth.currentUser;
      const isVerified = !!refreshed?.emailVerified;
      setVerified(isVerified);
      if (isVerified) {
        setLinkDetectedMessage('Email confirmed — thank you!');
        console.log('[ConfirmEmail] verified true');
      }
    } catch (err) {
      console.error('[ConfirmEmail] reload error', err);
    } finally {
      setCheckingVerification(false);
      setLoading(false);
    }
  }, []);

  // send initial verification on mount
  useEffect(() => {
    const current = auth.currentUser;
    if (current && !current.emailVerified) {
      sendEmailVerification(current, actionCodeSettings).catch((err: any) => {
        if (err?.code === 'auth/too-many-requests') {
          console.warn('[ConfirmEmail] skipped initial send: too many requests');
        } else {
          console.error('[ConfirmEmail] initial sendEmailVerification', err);
        }
      });
    }
  }, []);

  // resend handler with cooldown
  const handleResend = async () => {
    const current = auth.currentUser;
    if (!current) {
      Alert.alert('Error 🔒', 'No authenticated user found.');
      return;
    }

    try {
      setResending(true);
      await sendEmailVerification(current, actionCodeSettings);
      setResendCooldownSec(30);
      Alert.alert('Verification Sent', 'A verification link was sent to your email.');
    } catch (err) {
      console.error('[ConfirmEmail] resend error', err);
      Alert.alert('Error', 'Could not resend verification email.');
    } finally {
      setResending(false);
    }
  };

  // cooldown countdown
  useEffect(() => {
    if (resendCooldownSec <= 0) return;
    const t = setInterval(() => {
      setResendCooldownSec((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldownSec]);

  // handle deep links and app resume
  useEffect(() => {
    const urlListener = ({ url }: { url: string }) => {
      console.log('[ConfirmEmail] Linking url received:', url);
      reloadAndCheck();
      setLinkDetectedMessage('Returned from email link — checking verification...');
    };

    const sub = Linking.addEventListener
      ? Linking.addEventListener('url', urlListener)
      : Linking.addEventListener('url', urlListener);

    const subscription = AppState.addEventListener?.('change', (state: AppStateStatus) => {
      if (state === 'active') reloadAndCheck();
    });

    return () => {
      try {
        if (sub && typeof sub.remove === 'function') sub.remove();
        if (subscription && typeof subscription.remove === 'function') subscription.remove();
      } catch (e) {
        console.error("Couldn't remove listener: ", e);
      }
    };
  }, [reloadAndCheck]);

  const handleContinue = async () => {
    if (!verified) {
      Alert.alert('Not verified!', 'Please click the verification link in your email first. 🚫');
      return;
    }

    try {
      console.log('[ConfirmEmail] continuing to personal info screen');
      router.replace('/(auth)/signup/personalInfo');
    } catch (err) {
      console.error('[ConfirmEmail] continue error', err);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="justify-between flex-1 px-6 bg-card-cardBGLight dark:bg-bodyBG">
        <View className="flex flex-col items-start justify-center gap-4 mt-10">
          <View className="mt-8">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(auth)/signup/confirmPassword');
                }
              }}
              className="dark:bg-misc-circleBtnDark flex h-[40px] w-[40px] items-center justify-center rounded-full border border-card-cardBorder dark:border-misc-arrowBorder "
            >
              <Feather
                name="arrow-left"
                size={22}
                color={colorScheme === 'dark' ? '#F5F5F5' : '#111827'}
              />
            </Pressable>
          </View>

          <View className="flex flex-col items-center justify-center w-full gap-4">
            <View className="h-[120px] w-[120px]">
              <Image source={require('@/assets/images/letter.png')} className="w-full h-full" />
            </View>

            <View className="flex flex-col items-center w-full gap-1 px-4 mx-auto">
              <Text className="text-[20px] font-[700] text-[#111827] dark:text-white">
                Almost there!
              </Text>

              <Text className="mt-2 w-[281px] text-center text-[14px] leading-6 text-[#4B5563] dark:text-[#D1D5DB]">
                Click on the link sent to the email (
                <Text className="font-[600] text-text-accentLight dark:text-text-accentDark">
                  {user?.email ?? '(your email)'}
                </Text>
                ) you provided.
              </Text>

              {linkDetectedMessage && (
                <Text className="mt-2 text-xl text-center text-white">
                  {linkDetectedMessage}
                </Text>
              )}

              {verified && (
                <Text className="mt-2 text-4xl text-center text-green-600">
                  You may continue now.
                </Text>
              )}
            </View>

            <View className="flex-row items-center justify-center mt-4">
              <Text className="text-[14px] font-[500] text-text-primaryLight dark:text-text-primaryDark">
                {"Didn't receive the link?"}
              </Text>

              <Pressable
                onPress={handleResend}
                disabled={resending || resendCooldownSec > 0}
                className="ml-2"
              >
                <Text
                  className={`text-[14px] font-[600] ${
                    resending || resendCooldownSec > 0 ? 'text-gray-400' : 'text-emerald-500'
                  }`}
                >
                  {resending
                    ? 'Sending...'
                    : resendCooldownSec > 0
                      ? `Retry in ${resendCooldownSec}s`
                      : 'Re-send'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="items-center justify-center gap-6 mb-10">
          <Animated.View style={pulseStyle}>
            <ButtonComponent
              title="Continue"
              onPress={handleContinue}
              loading={checkingVerification || loading}
              disabled={!verified || checkingVerification || loading}
              style={{ width: 328 }}
            />
          </Animated.View>
        </View>
      </View>
    </ScrollView>
  );
}
