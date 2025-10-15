import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { SignupFormSchema } from '@/lib/schemas/user';
import { useTrackOnboardingStep } from '@/lib/hooks/useTrackOnboardingStep';

// Use Hosting domain when ready. .env has the link btw
const actionCodeSettings: import('firebase/auth').ActionCodeSettings = {
  url: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_DYNAMIC_LINK as string,
  handleCodeInApp: true,
  iOS: { bundleId: 'com.mycyberclinics.app' },
  android: { packageName: 'com.mycyberclinics.app', installApp: true },
};

// confirmPassword must match password; password auto-filled from previous screen
const Step3Schema = SignupFormSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Oooops! Passwords do not match!',
});

type FormValues = z.infer<typeof Step3Schema>;

export default function ConfirmPasswordScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  useTrackOnboardingStep();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const { tempEmail, tempPassword, setTempPassword, loading } = useAuthStore();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(Step3Schema),
    defaultValues: {
      email: tempEmail ?? '',
      password: tempPassword ?? '',
      confirmPassword: '',
    },
  });

  // Prefill email and temp password
  useEffect(() => {
    if (tempEmail) setValue('email', tempEmail);
    if (tempPassword) setValue('password', tempPassword);
  }, [tempEmail, tempPassword, setValue]);

  // When confirmed password is submitted, this should save it as the real password
  // and trigger email verification link
  const onSubmit = async (data: FormValues) => {
    setTempPassword(data.confirmPassword);

    try {
      const auth = getFirebaseAuth();
      const current = auth.currentUser;

      if (current) {
        await sendEmailVerification(current, actionCodeSettings);
        console.log('[ConfirmPassword] Verification email requested');
      } else {
        console.warn('[ConfirmPassword] No current user to send verification to');
      }
    } catch (err) {
      console.error('[ConfirmPassword] sendEmailVerification error', err);
    }

    router.push('/(auth)/signup/verifyEmail');
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View
        className={`h-auto w-full flex-1 justify-between px-6 ${
          isDark ? 'bg-bodyBG' : 'bg-card-cardBGLight'
        }`}
      >
        <View>
          <View className="mt-8">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/(onboarding)/onboardingScreen3');
              }}
              className={`flex h-[40px] w-[40px] items-center justify-center rounded-full ${
                isDark ? 'border border-[#2F343A] bg-[#15191E]' : 'bg-[#F3F4F6]'
              }`}
            >
              <Feather name="arrow-left" size={22} color={isDark ? '#fff' : '#111827'} />
            </Pressable>
          </View>

          <View className="mt-4 mb-6">
            <Text
              className={`text-[14px] font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Step 3 of 7
            </Text>
            <View className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-gray-200">
              <View className="h-[6px] rounded-full bg-[#1ED28A]" style={{ width: '42.82%' }} />
            </View>
          </View>

          <View className="flex flex-col gap-4 mb-4">
            <Text
              className={`text-[24px] font-[700] ${
                isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'
              }`}
            >
              Welcome To Cyberclinics
            </Text>
            <Text
              className={`text-[14px] ${
                isDark ? 'text-text-secondaryDark' : 'text-text-secondaryLight'
              }`}
            >
              Enjoy the full benefits and offers of Cyberclinic
            </Text>
          </View>

          <Text
            className={`mb-3 mt-6 text-[14px] font-[500] ${
              isDark ? 'text-text-primaryDark' : 'text-text-textInverse'
            }`}
          >
            Email
          </Text>
          <View
            className={`h-[40px] w-full flex-row items-center rounded-[4px] border px-[12px] ${
              focusedField === 'email'
                ? 'border-[#1ED28A]'
                : isDark
                  ? 'border-text-secondaryLight'
                  : 'border-button-buttonLight'
            } ${isDark ? 'bg-card-cardBG' : 'bg-card-cardBGLight'}`}
          >
            <Feather name="mail" size={18} color="#9CA3AF" />
            <Controller
              control={control}
              name="email"
              render={({ field: { value } }) => (
                <TextInput
                  value={value}
                  editable={false}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  className={`flex-1 px-2 py-3 ${
                    isDark ? 'text-misc-placeholderTextDark' : 'text-misc-placeHolderTextLight'
                  }`}
                />
              )}
            />
          </View>

          <View className="mt-6">
            <Text
              className={`mb-3 text-[14px] font-[500] ${
                isDark ? 'text-text-primaryDark' : 'text-text-textInverse'
              }`}
            >
              Password
            </Text>
            <View
              className={`h-[48px] flex-row items-center rounded-[4px] border px-[12px] ${
                focusedField === 'password'
                  ? 'border-[#1ED28A]'
                  : isDark
                    ? 'border-gray-700 bg-[#15191E]'
                    : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Feather name="lock" size={18} color="#9CA3AF" />
              <Controller
                control={control}
                name="password"
                render={({ field: { value } }) => (
                  <TextInput
                    value={value}
                    editable={false}
                    secureTextEntry
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    className={`flex-1 px-2 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
                  />
                )}
              />
            </View>
          </View>

          <View className="mt-6">
            <Text
              className={`mb-3 text-[14px] font-[500] ${
                isDark ? 'text-text-primaryDark' : 'text-text-textInverse'
              }`}
            >
              Re-enter Password
            </Text>
            <View
              className={`h-[48px] flex-row items-center rounded-[4px] border px-[12px] ${
                focusedField === 'confirmPassword'
                  ? 'border-[#1ED28A]'
                  : isDark
                    ? 'border-gray-700 bg-[#15191E]'
                    : 'border-gray-300 bg-gray-50'
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
                    className={`flex-1 px-2 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
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
      </View>

      <View className="items-center justify-center gap-6 mb-10">
        <View className="items-center">
          <TouchableOpacity
            disabled={isSubmitting || loading}
            onPress={handleSubmit(onSubmit)}
            className="flex h-[48px] w-[328px] items-center justify-center rounded-full bg-[#1ED28A]"
          >
            {isSubmitting || loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-[14px] font-[600] text-white">Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mx-auto">
          <Text
            className={`text-[14px] font-[500] ${
              isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'
            }`}
          >
            Already have an account?
          </Text>
          <Pressable onPress={() => router.push('/(auth)/signIn')}>
            <Text className="text-[14px] font-[500] text-emerald-500"> Sign in</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
