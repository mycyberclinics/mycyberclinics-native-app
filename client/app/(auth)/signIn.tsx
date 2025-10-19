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
  Platform,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();

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

  const user = useAuthStore((state) => state.user);
  const displayName =
    user && 'email' in user && user.email ? user.email.split('@')[0] : user?.email || 'User';

  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const onSubmit = async (data: FormValues) => {
    if (!agreed) {
      alert('Please agree to the terms before signing in.');
      return;
    }

    try {
      await signIn(data.email, data.password);
      const user = useAuthStore.getState().user;
      if (user) {
        try {
          await fetchProfile();
        } catch (err) {
          console.error('[SignIn] Backend profile fetch failed:', err);
        }
        router.replace('/(main)/home');
      }
    } catch (error) {
      console.error('[SignIn] Backend profile fetch failed:', error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Platform.OS === 'web' ? 60 : 0,
      }}
    >
      <View
        className={`  flex-1 items-center justify-center ${isDark ? 'bg-[#0B0E11]' : 'bg-white'}`}
        style={{
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minHeight: '100%',
          paddingHorizontal: isTablet ? 40 : 20,
        }}
      >
        <View
          className={` h-full w-full justify-between  ${isDark ? 'bg-[#0B0E11]' : 'bg-white'}`}
          style={{
            maxWidth: isDesktop ? 480 : isTablet ? 420 : 360,
            width: '100%',
            alignSelf: 'center',
            borderRadius: isDesktop ? 16 : 0,
            paddingVertical: isDesktop ? 40 : 0,
            boxShadow: isDesktop ? '0px 4px 20px rgba(0, 0, 0, 0.1)' : undefined,
          }}
        >
          <View className="flex flex-col items-center justify-center gap-6">
            <View className="mt-8 self-start">
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

            <View className="h-auto w-full items-start justify-center gap-2">
              <Text
                className={`text-[28px] font-[700] leading-8 ${
                  isDark ? 'text-text-secondaryTextDark' : 'text-text-textInverse'
                }`}
              >
                {`Welcome Back, ${displayName}`}
              </Text>
              <Text
                className={`text-[16px] font-[400] leading-6 ${
                  isDark ? 'text-text-secondaryDark' : 'text-text-secondaryLight'
                }`}
              >
                Login to continue to enjoy Cyberclinic
              </Text>
            </View>

            <Text
              className={`self-start text-[14px] font-[500] ${
                isDark ? 'text-text-primaryDark' : 'text-text-textInverse'
              }`}
            >
              Email
            </Text>
            <View
              className={`h-[48px] w-full flex-row items-center rounded-[4px] border px-[12px] ${
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
                    underlineColorAndroid="transparent"
                    selectionColor="transparent"
                    style={{ outlineStyle: 'none' }}
                    className={`flex-1 border-0 px-2 py-3 ${
                      isDark ? 'text-misc-placeholderTextDark' : 'text-misc-placeHolderTextLight'
                    }`}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text className="mb-3 text-sm text-red-400">{errors.email.message}</Text>
            )}

            <Text
              className={`self-start text-[14px] font-[500] ${
                isDark ? 'text-text-primaryDark' : 'text-text-textInverse'
              }`}
            >
              Password
            </Text>
            <View
              className={`h-[48px] w-full flex-row items-center justify-center rounded-[4px] border px-[12px] ${
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
                    underlineColorAndroid="transparent"
                    selectionColor="transparent"
                    style={{ outlineStyle: 'none' }}
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

            <View className="mb-8 mt-2 flex-row items-center">
              <Checkbox
                value={agreed}
                onValueChange={setAgreed}
                color={agreed ? '#10B981' : undefined}
                className={`${isDark ? 'bg-card-cardBG' : 'bg-card-cardBGLight'} ${
                  isDark ? 'border-text-secondaryLight' : 'border-button-buttonLight'
                }`}
              />
              <Text
                className={`ml-2 flex-shrink text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                style={{ maxWidth: isDesktop ? 420 : '100%' }}
              >
                I agree to the <Text className="text-emerald-500">terms of service</Text> and{' '}
                <Text className="text-emerald-500">privacy policy</Text> of cyberclinics
              </Text>
            </View>
          </View>

          <View className="mb-10 items-center justify-center gap-6">
            <TouchableOpacity
              disabled={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              className={`flex h-[48px] w-[328px] items-center justify-center rounded-full py-3 ${
                isDark
                  ? 'border-button-signInButtonBorderDark'
                  : 'border-button-signInButtonBorderLight'
              } ${
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
                  className={`text-center text-[14px] font-[500] ${
                    isDark ? 'text-text-textInverse' : 'text-text-secondaryTextDark'
                  }`}
                >
                  Sign in
                </Text>
              )}
            </TouchableOpacity>

            <View className="mx-auto flex-row justify-center">
              <Text
                className={`text-[14px] font-[500] ${
                  isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'
                }`}
              >
                {"Don't have an account? "}
              </Text>
              <Pressable onPress={() => router.push('/(auth)/signup/emailPassword')}>
                <Text
                  className={`text-[14px] font-[500] text-emerald-500 ${
                    loading ? 'Wait...' : 'Sign Up'
                  }`}
                >
                  Sign up
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
