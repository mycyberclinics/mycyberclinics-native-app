import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useColorScheme,
  Image,
  Alert,
  AppState,
  Platform,
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

/**
 * Layout adjustments:
 * - Reduced vertical spacing between the "Almost there" section and the "Didn't receive the link?" row
 *   by grouping them in a single centered block and using smaller margins.
 * - Continue button remains centered near the bottom.
 * - Theme-aware text colors preserved (dark -> light text, light -> dark text).
 *
 * Replace the existing file with this one to reduce the gap.
 */

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useTrackOnboardingStep();

  const auth = getFirebaseAuth();
  const {
    user,
    loading,
    setLoading,
    verificationSentByBackend,
    setVerificationSentByBackend,
    setUser,
    loadProfile,
    setOnboardingComplete,
    setLastStep,
  } = useAuthStore();

  const [resending, setResending] = useState(false);
  const [resendCooldownSec, setResendCooldownSec] = useState(0);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verified, setVerified] = useState<boolean>(!!user?.emailVerified);
  const [linkDetectedMessage, setLinkDetectedMessage] = useState<string | null>(null);
  const [tooManyRequests, setTooManyRequests] = useState<boolean>(false);

  // subtle pulse for Continue when actionable
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
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const reloadAndCheck = useCallback(async () => {
    try {
      setCheckingVerification(true);
      await reload(getFirebaseAuth().currentUser!);
      const refreshed = getFirebaseAuth().currentUser;
      const isVerified = !!refreshed?.emailVerified;
      setVerified(isVerified);

      if (refreshed) {
        setUser(refreshed);
      }

      if (isVerified) {
        setLinkDetectedMessage('Email confirmed — you may continue.');
      } else {
        setLinkDetectedMessage(null);
      }

      console.log('[ConfirmEmail] FULL USER OBJECT:', refreshed);
      console.log('[ConfirmEmail] emailVerified after reload:', refreshed?.emailVerified);
    } catch (err) {
      console.error('[ConfirmEmail] reload error', err);
    } finally {
      setCheckingVerification(false);
      setLoading(false);
    }
  }, [setLoading, setUser]);

  useEffect(() => {
    reloadAndCheck();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') reloadAndCheck();
    });
    return () => sub?.remove && sub.remove();
  }, [reloadAndCheck]);

  useEffect(() => {
    setVerified(!!auth.currentUser?.emailVerified);
  }, [auth.currentUser?.emailVerified]);

  const handleResend = async () => {
    const current = auth.currentUser;
    if (!current) {
      Alert.alert('Error', 'No authenticated user found.');
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
          console.error('[ConfirmEmail] backend resend error', err);
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
          Alert.alert('Error', "You've requested too many verification emails. Please wait.");
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

  const handleContinue = async () => {
    if (!verified) {
      Alert.alert('Not verified', 'Please click the verification link in your email first.');
      return;
    }

    try {
      setCheckingVerification(true);

      try {
        await getFirebaseAuth().currentUser?.getIdToken(true);
      } catch (e) {
        console.warn('[ConfirmEmail] getIdToken(true) failed:', e);
      }

      try {
        await loadProfile();
      } catch (err) {
        console.warn('[ConfirmEmail] loadProfile after verification failed:', err);
      }

      setOnboardingComplete();
      setLastStep(null);

      router.replace('/(auth)/signup/personalInfo');
    } catch (err) {
      console.error('[ConfirmEmail] continue error', err);
      Alert.alert('Error', 'Could not continue. Please try again.');
    } finally {
      setCheckingVerification(false);
      setLoading(false);
    }
  };

  const buttonWidth = Platform.OS === 'web' ? '100%' : 328;

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 28,
          backgroundColor: isDark ? '#0B0E11' : '#FFFFFF',
        }}
      >
        {/* Top back button */}
        <View style={{ marginBottom: 8 }}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(auth)/signup/confirmPassword');
            }}
            style={{
              height: 40,
              width: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isDark ? '#2F343A' : '#E5E7EB',
            }}
          >
            <Feather name="arrow-left" size={22} color={isDark ? '#F5F5F5' : '#111827'} />
          </Pressable>
        </View>

        {/* Centered block: icon, heading, description, and the "Didn't receive..." row directly under it */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={require('@/assets/images/letter.png')}
            style={{ width: 120, height: 120, marginBottom: 12 }}
          />

          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: isDark ? '#FFFFFF' : '#111827',
              textAlign: 'center',
            }}
          >
            Almost there!
          </Text>

          <Text
            style={{
              marginTop: 10,
              maxWidth: 340,
              textAlign: 'center',
              color: isDark ? '#D1D5DB' : '#4B5563',
            }}
          >
            Click the link sent to the email{' '}
            <Text style={{ fontWeight: '600', color: isDark ? '#10B981' : '#047857' }}>
              {user?.email ?? '(your email)'}
            </Text>
            .
          </Text>

          {linkDetectedMessage ? (
            <Text style={{ marginTop: 10, color: isDark ? '#A7F3D0' : '#065F46' }}>
              {linkDetectedMessage}
            </Text>
          ) : null}

          {verified && (
            <Text style={{ marginTop: 10, fontSize: 28, color: '#10B981' }}>
              You may continue now.
            </Text>
          )}

          {/* Reduced spacing: put the "Didn't receive the link?" row close to the description */}
          <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
              Didn&apos;t receive the link?
            </Text>

            <Pressable
              onPress={handleResend}
              disabled={resending || resendCooldownSec > 0 || tooManyRequests}
              style={{ marginLeft: 12 }}
            >
              <Text style={{ color: '#10B981' }}>
                {resending
                  ? 'Sending...'
                  : resendCooldownSec > 0
                    ? `Retry in ${resendCooldownSec}s`
                    : 'Re-send'}
              </Text>
            </Pressable>

            <Pressable onPress={reloadAndCheck} style={{ marginLeft: 12 }}>
              <Text style={{ color: '#10B981' }}>Check again</Text>
            </Pressable>
          </View>
        </View>

        {/* Continue button area (near bottom) */}
        <View style={{ alignItems: 'center' }}>
          {/* CONFIRM BUTTON WIDTH WHEN TESTINGH  HERE!!! */}
          <Animated.View style={[{ width: buttonWidth, maxWidth: 328 }, pulseStyle]}>
            <ButtonComponent
              title="Continue"
              onPress={handleContinue}
              loading={checkingVerification || loading}
              disabled={!verified || checkingVerification || loading}
              style={{ width: '100%' }}
            />
          </Animated.View>
        </View>
      </View>
    </ScrollView>
  );
}
