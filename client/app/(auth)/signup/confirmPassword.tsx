import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, useColorScheme, Pressable, Alert } from 'react-native';
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
import ButtonComponent from '@/components/ButtonComponent';

/**
 * Note:
 * - We do NOT automatically call Firebase's sendEmailVerification here if the backend already
 *   sent the custom SendGrid template. The backend should already have been called in signUp.
 * - We keep a fallback to call Firebase when verificationSentByBackend is false.
 */

const actionCodeSettings: import('firebase/auth').ActionCodeSettings = {
  url: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_DYNAMIC_LINK as string,
  handleCodeInApp: true,
  iOS: { bundleId: 'com.mycyberclinics.app' },
  android: { packageName: 'com.mycyberclinics.app', installApp: true },
};

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
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Get both from store
  const { tempEmail, tempPassword, setTempPassword, loading, verificationSentByBackend, signUp } =
    useAuthStore();

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

  // Prefill from temp values
  useEffect(() => {
    if (tempEmail) setValue('email', tempEmail);
    if (tempPassword) setValue('password', tempPassword);
  }, [tempEmail, tempPassword, setValue]);

  // Submit: confirm password, then trigger signUp
  const onSubmit = async (data: FormValues) => {
    setTempPassword(data.confirmPassword);

    const email = tempEmail;
    const password = data.confirmPassword;

    try {
      // Only trigger signUp here!
      const signupSuccess = await signUp(email!, password!);

      if (!signupSuccess) {
        Alert.alert('Sign up failed', 'Unable to create account. Please check your info and try again.');
        return;
      }

      // Now handle email verification logic
      const auth = getFirebaseAuth();
      const current = auth.currentUser;

      if (current) {
        if (verificationSentByBackend) {
          // Backend already sent a custom template. Do not show any error or popup.
          console.log(
            '[ConfirmPassword] Backend sent verification email — skipping client sendEmailVerification'
          );
          // Optionally show a toast or nothing at all.
        } else {
          // Fallback: call Firebase's sendEmailVerification (default template)
          try {
            await sendEmailVerification(current, actionCodeSettings);
            console.log('[ConfirmPassword] Verification email requested (Firebase default)');
            Alert.alert('Verification sent', 'A Firebase verification email has been sent.');
          } catch (err: any) {
            // ONLY show error if it's not a backend-driven flow
            console.error('[ConfirmPassword] sendEmailVerification error', err);
            Alert.alert('Error', 'Could not send verification email. Please try again later.');
          }
        }
      } else {
        console.warn('[ConfirmPassword] No current user to send verification to');
      }
    } catch (err) {
      console.error('[ConfirmPassword] unexpected error', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return;
    }

    router.push('/(auth)/signup/verifyEmail');
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 justify-between bg-card-cardBGLight px-6 dark:bg-bodyBG">
        <View>
          <View className="mt-8">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(auth)/signup/verifyPassword');
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

          <View className="mb-6 mt-4">
            <Text className="text-[14px] font-medium text-gray-700 dark:text-gray-300">
              Step 3 of 7
            </Text>
            <View className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <View className="h-[6px] rounded-full bg-[#1ED28A]" style={{ width: '42.82%' }} />
            </View>
          </View>

          <View className="mb-4 flex flex-col gap-4">
            <Text className="text-[24px] font-[700] text-text-primaryLight dark:text-text-primaryDark">
              Welcome To Cyberclinics
            </Text>
            <Text className="text-[14px] text-text-secondaryLight dark:text-text-secondaryDark">
              Enjoy the full benefits and offers of Cyberclinic
            </Text>
          </View>

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
              render={({ field: { value } }) => (
                <TextInput
                  value={value}
                  editable={false}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 px-2 py-3 text-misc-placeHolderTextLight dark:text-misc-placeholderTextDark"
                />
              )}
            />
          </View>

          <View className="mt-6">
            <Text className="mb-3 text-[14px] font-[500] text-text-textInverse dark:text-text-primaryDark">
              Password
            </Text>
            <View
              className={`h-[48px] flex-row items-center rounded-[4px] border px-[12px] ${
                focusedField === 'password'
                  ? 'border-[#1ED28A]'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-[#15191E]'
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
                    className="flex-1 px-2 py-3 text-gray-900 dark:text-white"
                  />
                )}
              />
            </View>
          </View>

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
        <View className="mb-10 items-center justify-center gap-6">
          <ButtonComponent
            title="Continue"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
            style={{ width: 328 }}
          />

          <View className="mx-auto flex-row justify-center">
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