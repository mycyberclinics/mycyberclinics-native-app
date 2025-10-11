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
import { Checkbox } from '@/components/ui/Checkbox';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '@/store/auth';
import { fetchProfile } from '@/lib/api/client';

type FormValues = { email: string; password: string };

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });

  const { signIn, loading } = useAuthStore();

  const [agreed, setAgreed] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    if (!agreed) {
      alert('Please agree to the terms before signing in.');
      return;
    }

    console.log('Signing in with:', data);
    try {
      await signIn(data.email, data.password);
      const user = useAuthStore.getState().user;
      if (user) {
        try {
          await fetchProfile(); // <-- backend upsert after login
        } catch (err) {
          console.error('[SignIn] Backend profile fetch failed:', err);
        }
        router.replace('/(main)/home');
      }
    } catch (error) {
      console.error('[SignIn] Backend profile fetch failed:', error);
    }
  };

  // const onGuest = async () => {
  //   await signIn('guest@mycyberclinics.com', 'guest-pass');
  //   const user = useAuthStore.getState().user;
  //   if (user) {
  //     try {
  //       await fetchProfile();
  //     } catch (err) {
  //       console.error('[SignIn] Backend profile fetch failed:', err);
  //     }
  //     router.replace('/(main)/home');
  //   }
  // };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className={`flex-1 justify-start  px-6 ${isDark ? 'bg-[#0B0E11]' : 'bg-white'}`}>
        {/* Back button */}
        <View className="items-start justify-center gap-4 ">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(onboarding)/onboardingScreen3');
              }
            }}
            className={` ${isDark ? 'border-misc-arrowBorder' : '#9CA3AF'} flex h-[40px] w-[40px] items-center justify-center rounded-full ${isDark ? 'border' : 'none'} ${isDark ? 'bg-card-cardBG' : 'bg-card-cardBGLight'} `}
          >
            <Feather name="arrow-left" size={22} color={isDark ? '#fff' : '#111827'} />
          </Pressable>

          {/* Header */}
          <View className="h-auto w-[328px] items-start justify-center gap-2 ">
            <Text
              className={`text-[24px] font-[700] leading-8 ${isDark ? 'text-text-secondaryTextDark' : 'text-text-textInverse'} w-full `}
            >
              Welcome Back, Josh
            </Text>
            <Text
              className={`h-[20px] w-full text-[14px] font-[400] leading-6  ${isDark ? 'text-text-secondaryDark' : 'text-text-secondaryLight'}`}
            >
              Login to continue enjoy cyberclinic
            </Text>
          </View>

          {/* Email */}
          <Text
            className={`h-[20px] w-[34px] text-[14px] font-[500] leading-6  ${isDark ? 'text-text-primaryDark' : 'text-text-textInverse'} `}
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
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Enter a valid email address',
                },
              }}
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
            <Text className="mb-3 text-sm text-red-400">{errors.email.message}</Text>
          )}

          {/* Password */}
          <Text
            className={`h-[20px] w-[59px] text-[14px] font-[500] leading-6  ${isDark ? 'text-text-primaryDark' : 'text-text-textInverse'} `}
          >
            Password
          </Text>
          <View
            className={`h-[40px] w-full flex-row items-center rounded-[4px] border px-[12px] ${
              focusedField === 'password'
                ? 'border-[#1ED28A]'
                : isDark
                  ? 'border-text-secondaryLight'
                  : 'border-button-buttonLight'
            } ${isDark ? 'bg-card-cardBG' : 'bg-card-cardBGLight'}`}
          >
            <Feather name="lock" size={18} color="#9CA3AF" />
            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              }}
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="************"
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
            <Text className="mb-3 text-sm text-red-400">{errors.password.message}</Text>
          )}

          {/* Terms */}
          <View className="flex-row items-center mt-2 mb-8">
            <Checkbox
              value={agreed}
              onValueChange={setAgreed}
              color={agreed ? '#10B981' : undefined}
              className={` ${isDark ? 'bg-card-cardBG' : 'bg-card-cardBGLight'} ${isDark ? 'border-text-secondaryLight' : 'border-button-buttonLight'}`}
            />
            <Text
              className={`ml-2 flex-shrink text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              I agree to the <Text className="text-emerald-500">terms of service</Text> and{' '}
              <Text className="text-emerald-500">privacy policy</Text> of cyberclinics
            </Text>
          </View>
        </View>

        {/* Sign in button */}
        <TouchableOpacity
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          className={`rounded-full py-3 ${isDark ? 'border-button-signInButtonBorderDark' : 'border-button-signInButtonBorderLight'} ${
            agreed
              ? 'bg-button-buttonBG'
              : isDark
                ? 'bg-button-buttonBG'
                : 'bg-button-buttonBGLight'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              className={`text-center font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}
            >
              Sign in
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign up link */}
        <View className="flex-row justify-center mt-6 mb-10">
          <Text className={isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'}>
            {"Don't have an account?"}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text className="font-semibold text-emerald-500"> Sign up</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
