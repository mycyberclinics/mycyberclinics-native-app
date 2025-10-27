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
import { reload, sendEmailVerification } from 'firebase/auth';
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
import api from '@/lib/api/client';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  useTrackOnboardingStep();

  const auth = getFirebaseAuth();
  const {
    user,
    loading,
    setLoading,
    verificationSentByBackend,
    setVerificationSentByBackend,
    setUser,
  } = useAuthStore();

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

  // Always reload when screen mounts
  useEffect(() => {
    reloadAndCheck();
  }, []);

  // reload firebase user and check verification
  const reloadAndCheck = useCallback(async () => {
    try {
      setCheckingVerification(true);
      await reload(getFirebaseAuth().currentUser!);
      const refreshed = getFirebaseAuth().currentUser;
      const isVerified = !!refreshed?.emailVerified;
      setVerified(isVerified);
      setUser(refreshed ? { id: refreshed.uid, email: refreshed.email || "", emailVerified: refreshed.emailVerified } : null); // update Zustand
      console.log('[ConfirmEmail] emailVerified after reload:', refreshed?.emailVerified);
      if (isVerified) {
        setLinkDetectedMessage('Email confirmed — thank you!');
      }
    } catch (err) {
      console.error('[ConfirmEmail] reload error', err);
    } finally {
      setCheckingVerification(false);
      setLoading(false);
    }
  }, [setUser, setLoading]);

  // Watch for changes to auth.currentUser (in case some other part updates it)
  useEffect(() => {
    setVerified(!!auth.currentUser?.emailVerified);
  }, [auth.currentUser?.emailVerified]);

  // resend handler with cooldown (uses single explicit backend endpoint)
  const handleResend = async () => {
    const current = auth.currentUser;
    if (!current) {
      Alert.alert('Error 🔒', 'No authenticated user found.');
      return;
    }

    try {
      setResending(true);

      if (verificationSentByBackend) {
        // Ask backend to resend via the explicit endpoint that signUp expects
        try {
          console.log('[ConfirmEmail] Requesting backend resend: /api/resend-verification', { email: current.email });
          const r = await api.post('/api/resend-verification', { email: current.email, firebaseUid: current.uid });
          if (r && r.status >= 200 && r.status < 300) {
            setResendCooldownSec(30);
            Alert.alert('Verification Sent', 'A verification link was (re)sent via backend.');
            setVerificationSentByBackend(true);
            return;
          } else {
            console.warn('[ConfirmEmail] backend resend returned non-OK', r.status, r.data);
            Alert.alert('Error', 'Backend resend returned unexpected response.');
          }
        } catch (err: any) {
          console.error('[ConfirmEmail] backend resend error', err?.response ?? err?.message ?? err);
          Alert.alert('Error', 'Could not ask backend to resend verification email.');
        }
      }

      // fallback to Firebase if backend not used or failed
      try {
        await sendEmailVerification(current);
        setResendCooldownSec(30);
        Alert.alert('Verification Sent', 'A verification link was sent to your email (Firebase).');
      } catch (err: any) {
        console.error('[ConfirmEmail] firebase resend error', err);
        Alert.alert('Error', 'Failed to resend verification via Firebase.');
      }
    } finally {
      setResending(false);
    }
  };

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

  // Linking and AppState listeners for verification check
  useEffect(() => {
    const urlListener = ({ url }: { url: string }) => {
      console.log('[ConfirmEmail] Linking url received:', url);
      reloadAndCheck();
      setLinkDetectedMessage('Returned from email link — checking verification...');
    };

    // Expo SDK 48+ uses addEventListener, older uses on
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

    const auth = getFirebaseAuth();
    await auth.currentUser?.getIdToken(true); // Force refresh token
    console.log('[ConfirmEmail] Token refreshed after verification');

    try {
      router.replace('/(auth)/signup/personalInfo');
    } catch (err) {
      console.error('[ConfirmEmail] continue error', err);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 justify-between bg-card-cardBGLight px-6 dark:bg-bodyBG">
        <View className="mt-10 flex flex-col items-start justify-center gap-4">
          <View className="mt-8">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(auth)/signup/confirmPassword');
                }
              }}
              className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-card-cardBorder dark:border-misc-arrowBorder dark:bg-misc-circleBtnDark "
            >
              <Feather
                name="arrow-left"
                size={22}
                color={colorScheme === 'dark' ? '#F5F5F5' : '#111827'}
              />
            </Pressable>
          </View>

          <View className="flex w-full flex-col items-center justify-center gap-4">
            <View className="h-[120px] w-[120px]">
              <Image source={require('@/assets/images/letter.png')} className="h-full w-full" />
            </View>

            <View className="mx-auto flex w-full flex-col items-center gap-1 px-4">
              <Text className="text-[20px] font-[700] text-[#111827] dark:text-white">
                Almost there!
              </Text>

              <Text className="mt-2 w-[281px] text-center text-[14px] leading-6 text-[#4B5563] dark:text-[#D1D5DB]">
                Click the link sent to the email{' '}
                <Text className="font-[600] text-text-accentLight dark:text-text-accentDark">
                  {user?.email ?? '(your email)'}
                </Text>
                .
              </Text>

              {linkDetectedMessage && (
                <Text className="mt-2 text-center text-xl text-white">{linkDetectedMessage}</Text>
              )}

              {verified && (
                <Text className="mt-2 text-center text-4xl text-green-600">
                  You may continue now.
                </Text>
              )}
            </View>

            <View className="mt-4 flex-row items-center justify-center">
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

        <View className="mb-10 items-center justify-center gap-6">
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