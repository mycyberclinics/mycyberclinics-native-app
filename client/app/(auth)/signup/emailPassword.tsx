import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/auth';
import { UserSchema } from '@/lib/schemas/user';

const Step1Schema = UserSchema.pick({ email: true, password: true });

type Step1FormValues = z.infer<typeof Step1Schema>;

export default function Step1Screen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(Step1Schema),
    defaultValues: { email: '', password: '' },
  });

  const { signUp, loading, setTempEmail } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const onSubmit = async (data: Step1FormValues) => {
    try {
      const success = await signUp(data.email, data.password || '');

      if (success) {
        setTempEmail(data.email);
        router.push('/(auth)/signup/verifyPassword');
      }
    } catch (err) {
      console.error('[Step1] Sign-up failed:', err);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View
        className={`h-auto w-full flex-1 justify-between px-6 ${isDark ? 'bg-bodyBG' : 'bg-card-cardBGLight'}`}
      >
        <View className="">
          <View className="mt-8">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(onboarding)/onboardingScreen3');
                }
              }}
              className={`flex h-[40px] w-[40px] items-center justify-center rounded-full ${
                isDark ? 'border border-[#2F343A] bg-[#15191E]' : 'bg-[#F3F4F6]'
              }`}
            >
              <Feather name="arrow-left" size={22} color={isDark ? '#fff' : '#111827'} />
            </Pressable>
          </View>

          <View className="mb-6 mt-4">
            <Text
              className={`text-[14px] font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Step 1 of 7
            </Text>
            <View className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-gray-200">
              <View className="h-[6px] rounded-full bg-[#1ED28A]" style={{ width: '14.28%' }} />
            </View>
          </View>

          <View className="mb-4 flex flex-col gap-4 ">
            <Text
              className={`text-[24px] font-[700] ${isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'}`}
            >
              Welcome To Cyberclinics
            </Text>
            <Text
              className={`text-[14px] ${isDark ? 'text-text-secondaryDark' : 'text-text-secondaryLight'}`}
            >
              Enjoy the full benefits and offers of Cyberclinic
            </Text>
          </View>

          <Text
            className={`mb-3 mt-6 text-[14px] font-[500] ${isDark ? 'text-text-primaryDark' : 'text-text-textInverse'}`}
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
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className={`flex-1 px-2 py-3 ${isDark ? 'text-misc-placeholderTextDark' : 'text-misc-placeHolderTextLight'}`}
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
            <Text
              className={`mb-3 h-[20px] w-[69px] text-[14px] font-[500] leading-6  ${isDark ? 'text-text-primaryDark' : 'text-text-textInverse'}`}
            >
              Password
            </Text>
            <View
              className={`h-[48px] flex-row items-center justify-center rounded-[4px] border px-[12px] ${
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
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    className={`flex-1 px-2 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
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

        <View className="mb-10 items-center justify-center gap-6 ">
          <View className="items-center ">
            <TouchableOpacity
              disabled={isSubmitting || loading}
              onPress={handleSubmit(onSubmit)}
              className={`flex h-[48px] w-[328px] items-center justify-center rounded-full ${
                isDark ? 'bg-[#1ED28A]' : 'bg-[#1ED28A]'
              }`}
            >
              {isSubmitting || loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-[14px] font-[600] text-white">Continue</Text>
              )}
            </TouchableOpacity>
          </View>
          <View className="mx-auto flex-row justify-center ">
            <Text
              className={`text-[14px] font-[500]  ${isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'}`}
            >
              {'Already have an account?'}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/signIn')}>
              <Text className="text-[14px] font-[500]  text-emerald-500"> Sign in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
