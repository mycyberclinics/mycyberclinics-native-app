import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  useColorScheme,
  Platform,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/auth';
import { SignupFormSchema } from '@/lib/schemas/user';
import { useTrackOnboardingStep } from '@/lib/hooks/useTrackOnboardingStep';
import ButtonComponent from '@/components/ButtonComponent';

const Step1Schema = SignupFormSchema;
type Step1FormValues = z.infer<typeof Step1Schema>;

// ✅ Max width only on web, mobile stays the same
const styles = StyleSheet.create({
  pageBG: {
    flex: 1,
  },
  webContainer: Platform.select({
    web: {
      width: '100%',
      maxWidth: 480, // adjust to taste (e.g., 420/560)
      alignSelf: 'center',
    },
    default: {},
  }),
});

export default function Step1Screen() {
  const router = useRouter();
  useTrackOnboardingStep(); // tracks current onboarding step
  const colorScheme = useColorScheme();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Step1FormValues>({
    resolver: zodResolver(Step1Schema),
    defaultValues: { email: '', password: '' },
  });

  // Only store values, don't call signUp here!
  const { setTempEmail, setTempPassword, loading } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const onSubmit = async (data: Step1FormValues) => {
    setTempEmail(data.email);
    setTempPassword(data.password);
    router.push('/(auth)/signup/verifyPassword');
    reset(undefined, { keepValues: true });
  };

  // ✅ Button: full width inside constrained container on web; keep fixed width on mobile
  const buttonWidth = Platform.OS === 'web' ? '100%' : 328;

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      {/* Outer BG stays full width; inner content is centered & constrained on web */}
      <View style={styles.pageBG} className="bg-card-cardBGLight dark:bg-bodyBG">
        <View style={styles.webContainer} className="w-full flex-1 justify-between px-6">
          <View>
            <View className="mt-8">
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(onboarding)/onboardingScreen3');
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

            {/* <View className="mt-4 mb-6">
              <Text className="text-[14px] font-medium text-gray-700 dark:text-gray-300">
                Step 1 of 7
              </Text>
              <View className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <View className="h-[6px] rounded-full bg-[#1ED28A]" style={{ width: '14.28%' }} />
              </View>
            </View> */}

            <View className="mb-4 mt-10 flex flex-col gap-4">
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
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your email address"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    underlineColorAndroid="transparent"
                    selectionColor="transparent"
                    //@ts-ignore
                    style={{
                      outlineStyle: 'none',
                      ...(Platform.OS === 'web' && {
                        outline: 'none',
                        boxShadow: 'none',
                        borderWidth: 0,
                      }),
                    }}
                    className="flex-1 px-2 py-3 text-misc-placeHolderTextLight dark:text-misc-placeholderTextDark"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text className="mt-1 text-sm text-red-400">{errors.email.message}</Text>
            )}

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
                      underlineColorAndroid="transparent"
                      selectionColor="transparent"
                      //@ts-ignore
                      style={{
                        outlineStyle: 'none',
                        ...(Platform.OS === 'web' && {
                          outline: 'none',
                          boxShadow: 'none',
                          borderWidth: 0,
                        }),
                      }}
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
          </View>

          <View className="mb-10 items-center justify-center gap-6">
            <ButtonComponent
              title="Continue"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting || loading}
              disabled={isSubmitting || loading}
              style={{ width: buttonWidth }}
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
      </View>
    </ScrollView>
  );
}
