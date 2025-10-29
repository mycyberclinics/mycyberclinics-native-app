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
  Platform,
  StyleSheet,
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

// ✅ Added: Web container to center and limit width
const styles = StyleSheet.create({
  pageBG: {
    flex: 1,
  },
  webContainer: Platform.select({
    web: {
      width: '100%',
      maxWidth: 480, // adjust as needed (e.g., 420–560)
      alignSelf: 'center',
    },
    default: {},
  }),
  fullWidth: { width: '100%' },
});

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
  const [tooManyRequests, setTooManyRequests] = useState<boolean>(false);

  const colorScheme = useColorScheme();

  // Pulse animation
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

  const reloadAndCheck = useCallback(async () => {
    try {
      setCheckingVerification(true);
      await reload(getFirebaseAuth().currentUser!);
      const refreshed = getFirebaseAuth().currentUser;
      const isVerified = !!refreshed?.emailVerified;
      setVerified(isVerified);
      setUser(
        refreshed
          ? {
              id: refreshed.uid,
              email: refreshed.email || '',
              emailVerified: refreshed.emailVerified,
            }
          : null,
      );
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

  useEffect(() => {
    reloadAndCheck();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') reloadAndCheck();
    });
    return () => subscription?.remove();
  }, [reloadAndCheck]);

  useEffect(() => {
    setVerified(!!auth.currentUser?.emailVerified);
  }, [auth.currentUser?.emailVerified]);

  const handleResend = async () => {
    const current = auth.currentUser;
    if (!current) {
      Alert.alert('Error 🔒', 'No authenticated user found.');
      return;
    }

    try {
      setResending(true);
      if (verificationSentByBackend) {
        try {
          const r = await api.post('/api/resend-verification', {
            email: current.email,
            firebaseUid: current.uid,
          });
          if (r && r.status >= 200 && r.status < 300) {
            setResendCooldownSec(60);
            Alert.alert('Verification Sent', 'A verification link was (re)sent via backend.');
            setVerificationSentByBackend(true);
            setTooManyRequests(false);
            return;
          } else {
            Alert.alert('Error', 'Backend resend returned unexpected response.');
          }
        } catch (err: any) {
          Alert.alert('Error', 'Could not ask backend to resend verification email.');
        }
      }

      try {
        await sendEmailVerification(current);
        setResendCooldownSec(60);
        setTooManyRequests(false);
        Alert.alert('Verification Sent', 'A verification link was sent to your email.');
      } catch (err: any) {
        if (err?.code === 'auth/too-many-requests') {
          setTooManyRequests(true);
          Alert.alert('Error', 'Too many requests. Please wait before retrying.');
        } else {
          Alert.alert('Error', 'Failed to resend verification via Firebase.');
        }
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

  useEffect(() => {
    const urlListener = ({ url }: { url: string }) => {
      reloadAndCheck();
      setLinkDetectedMessage('Returned from email link — checking verification...');
    };

    const sub = Linking.addEventListener
      ? Linking.addEventListener('url', urlListener)
      : Linking.addEventListener('url', urlListener);

    return () => {
      try {
        if (sub && typeof sub.remove === 'function') sub.remove();
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
    await auth.currentUser?.getIdToken(true);
    router.replace('/(auth)/signup/personalInfo');
  };

  // ✅ Button width logic same as Step1Screen
  const buttonWidth = Platform.OS === 'web' ? '100%' : 328;

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.pageBG} className=" bg-card-cardBGLight dark:bg-bodyBG">
        <View style={styles.webContainer} className="justify-between flex-1 w-full px-6 ">
          <View className="flex flex-col items-start justify-center gap-4 mt-10">
            <View className="mt-8">
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) router.back();
                  else router.replace('/(auth)/signup/confirmPassword');
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

            <View className="flex flex-col items-center justify-center w-full gap-4">
              <View className="h-[120px] w-[120px]">
                <Image source={require('@/assets/images/letter.png')} className="w-full h-full" />
              </View>

              <View className="flex flex-col items-center w-full gap-1 px-4 mx-auto">
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
                  <Text className="mt-2 text-xl text-center text-white">{linkDetectedMessage}</Text>
                )}
                {verified && (
                  <Text className="mt-2 text-4xl text-center text-green-600">
                    You may continue now.
                  </Text>
                )}
                {tooManyRequests && (
                  <Text className="mt-2 text-base text-center text-red-600">
                    Too many verification requests. Please wait before retrying.
                  </Text>
                )}
              </View>

              <View className="flex-row items-center justify-center mt-4">
                <Text className="text-[14px] font-[500] text-text-primaryLight dark:text-text-primaryDark">
                  {"Didn't receive the link?"}
                </Text>

                <Pressable
                  onPress={handleResend}
                  disabled={resending || resendCooldownSec > 0 || tooManyRequests}
                  className="ml-2"
                >
                  <Text
                    className={`text-[14px] font-[600] ${
                      resending || resendCooldownSec > 0 || tooManyRequests
                        ? 'text-gray-400'
                        : 'text-emerald-500'
                    }`}
                  >
                    {resending
                      ? 'Sending...'
                      : resendCooldownSec > 0
                        ? `Retry in ${resendCooldownSec}s`
                        : tooManyRequests
                          ? 'Wait before retry'
                          : 'Re-send'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={reloadAndCheck}
                  disabled={checkingVerification}
                  className="ml-4"
                >
                  <Text className="text-[14px] font-[600] text-emerald-500">Check again</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="items-center justify-center w-full gap-6 mb-10 ">
            <Animated.View
              style={[pulseStyle, styles.fullWidth]}
              className="w-full border border-red-700"
            >
              <ButtonComponent
                title="Continue"
                onPress={handleContinue}
                loading={checkingVerification || loading}
                disabled={!verified || checkingVerification || loading}
                style={{ width: buttonWidth }}
              />
            </Animated.View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
