import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, useColorScheme } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Progress from 'react-native-progress';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useTrackOnboardingStep } from '@/lib/hooks/useTrackOnboardingStep';
import ButtonComponent from '@/components/ButtonComponent';
import { SignupFormSchema } from '@/lib/schemas/user';

const StepSchema = SignupFormSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Oooops! Passwords do not match!',
});

type FormValues = z.infer<typeof StepSchema>;

const actionCodeSettings: import('firebase/auth').ActionCodeSettings = {
  url: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_DYNAMIC_LINK as string,
  handleCodeInApp: true,
  iOS: { bundleId: 'com.mycyberclinics.app' },
  android: { packageName: 'com.mycyberclinics.app', installApp: true },
};

type ValidationRowProps = {
  label: string;
  passed: boolean;
  index: number;
};

const AnimatedValidationRow: React.FC<ValidationRowProps> = ({ label, passed, index }) => {
  const entranceOpacity = useSharedValue(0);
  const entranceY = useSharedValue(10);
  const iconOpacity = useSharedValue(passed ? 1 : 0.3);
  const iconScale = useSharedValue(passed ? 1 : 0.8);

  useEffect(() => {
    entranceOpacity.value = withDelay(index * 110, withTiming(1, { duration: 420 }));
    entranceY.value = withDelay(index * 110, withSpring(0, { damping: 12 }));
  }, []);

  useEffect(() => {
    iconOpacity.value = withTiming(passed ? 1 : 0.3, { duration: 220 });
    iconScale.value = withSpring(passed ? 1 : 0.8, { damping: 12 });
  }, [passed]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [{ translateY: entranceY.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Animated.View style={rowStyle} className="flex-row items-center gap-2 mb-2 space-x-3">
      <Animated.View style={iconStyle}>
        {passed ? (
          <Feather name="check-circle" size={18} color="#1ED28A" />
        ) : (
          <Feather name="x-circle" size={18} color="#EF4444" />
        )}
      </Animated.View>
      <Text className={passed ? 'font-semibold text-[#1ED28A]' : 'text-red-500'}>{label}</Text>
    </Animated.View>
  );
};

export default function EmailPasswordConfirmScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  useTrackOnboardingStep();

  const { tempEmail, setTempPassword, loading, verificationSentByBackend, signUp } = useAuthStore();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(StepSchema),
    defaultValues: {
      email: tempEmail ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (tempEmail) setValue('email', tempEmail);
  }, [tempEmail, setValue]);

  const password = watch('password') ?? '';

  const checks = useMemo(
    () => [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', valid: /[a-z]/.test(password) },
      { label: 'Contains number', valid: /[0-9]/.test(password) },
      { label: 'Contains special character', valid: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );

  const passedCount = checks.filter((c) => c.valid).length;
  const strengthValue = passedCount / checks.length;

  const strengthMeta = useMemo(() => {
    if (passedCount <= 2) return { label: 'Too Weak', color: '#EF4444' };
    if (passedCount <= 4) return { label: 'Moderate', color: '#F59E0B' };
    return { label: 'Strong', color: '#1ED28A' };
  }, [passedCount]);

  const strengthOpacity = useSharedValue(0);
  const strengthScale = useSharedValue(1);
  useEffect(() => {
    strengthOpacity.value = 0;
    strengthOpacity.value = withTiming(1, { duration: 360 });
    if (strengthMeta.label === 'Strong') {
      strengthScale.value = withSequence(withSpring(1.15, { damping: 8 }), withSpring(1));
    } else {
      strengthScale.value = withTiming(1, { duration: 200 });
    }
  }, [strengthMeta.label]);

  const strengthAnimStyle = useAnimatedStyle(() => ({
    opacity: strengthOpacity.value,
    transform: [{ scale: strengthScale.value }],
  }));

  const onSubmit = async (data: FormValues) => {
    setTempPassword(data.password);

    const email = data.email;
    const password = data.password;

    try {
      const signupSuccess = await signUp(email!, password!);

      if (!signupSuccess) {
        Alert.alert(
          'Sign up failed',
          'Unable to create account. Please check your info and try again.',
        );
        return;
      }

      const auth = getFirebaseAuth();
      const current = auth.currentUser;

      if (current) {
        if (verificationSentByBackend) {
          console.log(
            '[EmailPasswordConfirm] Backend sent verification email — skipping Firebase send.',
          );
        } else {
          try {
            await sendEmailVerification(current, actionCodeSettings);
            console.log('[EmailPasswordConfirm] Verification email requested (Firebase default)');
            Alert.alert('Verification sent', 'A Firebase verification email has been sent.');
          } catch (err: any) {
            console.error('[EmailPasswordConfirm] sendEmailVerification error', err);
            Alert.alert('Error', 'Could not send verification email. Please try again later.');
          }
        }
      } else {
        console.warn('[EmailPasswordConfirm] No current user to send verification to');
      }
    } catch (err) {
      console.error('[EmailPasswordConfirm] unexpected error', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return;
    }

    router.push('/(auth)/signup/verifyEmail');
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="justify-between flex-1 px-6 bg-card-cardBGLight dark:bg-bodyBG">
        <View>
          <View className="mt-8">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/(auth)/signup/emailPassword');
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

          <View className="mt-4 mb-6">
            <Text className="text-[14px] font-medium text-gray-700 dark:text-gray-300">
              Step 2 of 7
            </Text>
            <View className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <View className="h-[6px] rounded-full bg-[#1ED28A]" style={{ width: '42.82%' }} />
            </View>
          </View>

          <View className="flex flex-col gap-4 mb-4">
            <Text className="text-[24px] font-[700] text-text-primaryLight dark:text-text-primaryDark">
              Welcome To Cyberclinics
            </Text>
            <Text className="text-[14px] text-text-secondaryLight dark:text-text-secondaryDark">
              Enjoy the full benefits and offers of Cyberclinic
            </Text>
          </View>

          {/* Email Field */}
          <Text className="mb-3 mt-6 text-[14px] font-[500] text-text-textInverse dark:text-text-primaryDark">
            Email
          </Text>
          <View
            className={`h-[40px] w-full flex-row items-center rounded-[4px] border px-[12px] ${
              focusedField === 'email'
                ? 'border-[#1ED28A]'
                : 'border-button-buttonLight dark:border-text-secondaryLight'
            } bg-card-cardBGLight dark:bg-card-cardBG`}
          >
            <Feather name="mail" size={18} color="#9CA3AF" />
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 px-2 py-3 text-misc-placeHolderTextLight dark:text-misc-placeholderTextDark"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              )}
            />
          </View>

          {/* Password Field */}
          <View className="mt-6">
            <Text className="mb-3 h-[20px] text-[14px] font-[500] leading-6 text-text-textInverse dark:text-text-primaryDark">
              Password
            </Text>
            <View
              className={`h-[48px] flex-row items-center justify-center rounded-[4px] border px-[12px] ${
                focusedField === 'password'
                  ? 'border-[#1ED28A]'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-[#15191E]'
              }`}
            >
              <Feather name="lock" size={18} color="#9CA3AF" />
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    className="flex-1 px-2 py-3 text-gray-900 dark:text-white"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                )}
              />
              <Pressable onPress={() => setShowPassword((s) => !s)}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#9CA3AF" />
              </Pressable>
            </View>
            {errors.password && (
              <Text className="mt-1 text-sm text-red-400">{errors.password.message}</Text>
            )}
          </View>

          {/* Password Strength */}
          {password.length > 0 && (
            <View className="mt-4">
              <Progress.Bar
                progress={strengthValue}
                width={null}
                height={8}
                borderWidth={0}
                borderRadius={8}
                color={strengthMeta.color}
                unfilledColor="#E5E7EB"
              />
            </View>
          )}

          <View className="flex flex-row items-start justify-between py-2 mt-6">
            <View>
              {checks.map((c, idx) => (
                <AnimatedValidationRow key={idx} label={c.label} passed={c.valid} index={idx} />
              ))}
            </View>
            <Animated.Text
              style={[{ color: strengthMeta.color, marginTop: 10 }, strengthAnimStyle]}
              className="text-base font-semibold text-center"
            >
              {strengthMeta.label}
            </Animated.Text>
          </View>

          {/* Confirm Password */}
          <View className="mt-6">
            <Text className="mb-3 text-[14px] font-[500] text-text-textInverse dark:text-text-primaryDark">
              Re-enter Password
            </Text>
            <View
              className={`h-[48px] flex-row items-center rounded-[4px] border px-[12px] ${
                focusedField === 'confirmPassword'
                  ? 'border-[#1ED28A]'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-[#15191E]'
              }`}
            >
              <Feather name="lock" size={18} color="#9CA3AF" />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    className="flex-1 px-2 py-3 text-gray-900 dark:text-white"
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                )}
              />
              <Pressable onPress={() => setShowPassword((s) => !s)}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#9CA3AF" />
              </Pressable>
            </View>
            {errors.confirmPassword && (
              <Text className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</Text>
            )}
          </View>
        </View>

        {/* Continue + Sign in */}
        <View className="items-center justify-center gap-6 mb-10">
          <ButtonComponent
            title="Continue"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
            style={{ width: 328 }}
          />

          <View className="flex-row justify-center mx-auto">
            <Text className="text-[14px] font-[500] text-text-primaryLight dark:text-text-primaryDark">
              Already have an account?
            </Text>
            <Pressable onPress={() => router.push('/(auth)/signIn')}>
              <Text className="text-[14px] font-[500] text-emerald-500"> Sign in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
