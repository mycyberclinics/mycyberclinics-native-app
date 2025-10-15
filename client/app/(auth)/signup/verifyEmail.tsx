import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
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

const actionCodeSettings: import('firebase/auth').ActionCodeSettings = {
  url: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_DYNAMIC_LINK as string,
  handleCodeInApp: true,
  iOS: { bundleId: 'com.mycyberclinics.app' },
  android: { packageName: 'com.mycyberclinics.app', installApp: true },
};

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  useTrackOnboardingStep();

  const auth = getFirebaseAuth();


  const { user, loading, setLoading, completeSignUp } = useAuthStore();


  const [resending, setResending] = useState(false);
  const [resendCooldownSec, setResendCooldownSec] = useState(0);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verified, setVerified] = useState<boolean>(!!user?.emailVerified);
  const [linkDetectedMessage, setLinkDetectedMessage] = useState<string | null>(null);

  // button pulse animation while waiting
  const pulse = useSharedValue(1);

  // pulse start/stop depending on verified
  // this should help us know when a user has clicked the verification link
  // the pulse should stop when the user hits the link sent to their email
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

  // reload firebase user and update verified state
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
    let mounted = true;
    const sendIfNeeded = async () => {
      try {
        const current = auth.currentUser;
        if (current && !current.emailVerified) {
          await sendEmailVerification(current, actionCodeSettings);
          console.log('[ConfirmEmail] sent initial verification email to', current.email);
        }
      } catch (err: any) {
        if (err?.code === 'auth/too-many-requests') {
          console.warn('[ConfirmEmail] skipped initial send: too many requests');
        } else {
          console.error('[ConfirmEmail] initial sendEmailVerification', err);
        }
      }
    };
    if (mounted) sendIfNeeded();
    return () => {
      mounted = false;
    };
  }, []);

  // this resends handler with small cooldown
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

  // countdown effect for cooldown
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

  // handle deep-link URL events: when a user taps email link and returns to app
  useEffect(() => {
    const urlListener = ({ url }: { url: string }) => {
      console.log('[ConfirmEmail] Linking url received:', url);
      reloadAndCheck();
      setLinkDetectedMessage('Returned from email link — checking verification...');
    };

    const sub = Linking.addEventListener
      ? Linking.addEventListener('url', urlListener)
      : Linking.addEventListener('url', urlListener);

    // also check when the app becomes active 
    const subscription = AppState.addEventListener
      ? AppState.addEventListener('change', (state: AppStateStatus) => {
          if (state === 'active') {
            // when the app resumes, re-check user again 
            reloadAndCheck();
          }
        })
      : undefined;

    return () => {
      try {
        if (sub && typeof sub.remove === 'function') sub.remove();
        if (subscription && typeof subscription.remove === 'function') subscription.remove();
      } catch (e) {
        console.error("Couldn't remove listener: ", e);
      }
    };
  }, [reloadAndCheck]);

  //  only allow to continue if verified
  const handleContinue = async () => {
    if (!verified) {
      Alert.alert('Not verified!', 'Please click the verification link in your email first. 🚫');
      return;
    }

    // call store action to clear onboarding and move to next screen
    // could be changed if it doesn't meet project edpecations 
    try {
      // called completeSignUp here from the store to clear onboarding flag
      completeSignUp();
      router.replace('/(auth)/signup/personalInfo');
    } catch (err) {
      console.error('[ConfirmEmail] continue error', err);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View
        className={`flex-1 justify-between px-6 ${isDark ? 'bg-bodyBG' : 'bg-card-cardBGLight'}`}
      >
        <View className="flex flex-col items-start justify-center gap-4 mt-10 border-2 border-white">
          <View className="mt-8">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/(auth)/signup/verifyPassword');
              }}
              className={`flex h-[40px] w-[40px] items-center justify-center rounded-full ${isDark ? 'border border-[#2F343A] bg-[#15191E]' : 'bg-[#F3F4F6]'}`}
            >
              <Feather name="arrow-left" size={22} color={isDark ? '#fff' : '#111827'} />
            </Pressable>
          </View>
          <View className="flex flex-col items-center justify-center w-full gap-4 ">
            <View className="h-[120px] w-[120px]">
              <Image source={require('@/assets/images/letter.png')} className="w-full h-full" />
            </View>

            <View className="flex flex-col items-center w-full h-auto gap-1 px-4 mx-auto ">
              <Text
                className={`text-[20px] font-[700] ${isDark ? 'text-white' : 'text-[#111827]'}`}
              >
                Almost there!
              </Text>

              <Text
                className={`mt-2 h-auto w-[281px] text-center text-[14px] leading-6 ${isDark ? 'text-[#D1D5DB]' : 'text-[#4B5563]'}`}
              >
                Click on the link sent to the email (
                <Text
                  className={`font-[600] ${isDark ? 'text-text-accentDark' : 'text-text-accentLight'}`}
                >
                  {user?.email ?? '(your email)'}
                </Text>
                ) you provided.
              </Text>

              {linkDetectedMessage && (
                <Text className="mt-2 text-xl text-center text-emerald-500">
                  {linkDetectedMessage}
                </Text>
              )}

              {verified && (
                <Text className="mt-2 text-2xl text-center text-green-600">
                  Email confirmed — you may continue.
                </Text>
              )}
            </View>

            <View className="flex-row items-center justify-center mt-4">
              <Text
                className={`text-[14px] font-[500] ${isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'}`}
              >
                {"Didn't receive the link?"}
              </Text>

              <TouchableOpacity
                onPress={handleResend}
                disabled={resending || resendCooldownSec > 0}
                className="ml-2"
              >
                <Text
                  className={`text-[14px] font-[600] ${resending || resendCooldownSec > 0 ? 'text-gray-400' : 'text-emerald-500'}`}
                >
                  {resending
                    ? 'Sending...'
                    : resendCooldownSec > 0
                      ? `Retry in ${resendCooldownSec}s`
                      : 'Re-send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="items-center justify-center gap-6 mb-10">
          <Animated.View style={pulseStyle}>
            <TouchableOpacity
              disabled={!verified || checkingVerification || loading}
              onPress={handleContinue}
              className={`flex h-[48px] w-[328px] items-center justify-center rounded-full ${isDark ? 'bg-[#1ED28A]' : 'bg-[#1ED28A]'}`}
            >
              {checkingVerification || loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-[14px] font-[600] text-white">Continue</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </ScrollView>
  );
}
