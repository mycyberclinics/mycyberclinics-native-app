import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
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
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(Step1Schema),
    defaultValues: { email: '', password: '' },
  });

  const { signUp, loading, setTempEmail } = useAuthStore();

  //   const onSubmit = async (data: Step1FormValues) => {
  //     try {
  //       const success = await signUp(data.email, data.password || '');

  //       if (success) {
  //         setTempEmail(data.email);
  //         router.push('/(auth)/signup/verifyPassword');
  //       }
  //     } catch (err) {
  //       console.error('[Step1] Sign-up failed:', err);
  //     }
  //   };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View
        className={`h-auto w-full flex-1 justify-between px-6 ${isDark ? 'bg-bodyBG' : 'bg-card-cardBGLight'}`}
      >
        <View className="">
          <View>
            <Image source={require('@/assets/images/onboarding1.png')} className="relative" />
          </View>
          <View className="mx-auto flex-row justify-center ">
            <Text
              className={`text-[14px] font-[500]  ${isDark ? 'text-text-primaryDark' : 'text-text-primaryLight'}`}
            >
              {"Didn't receive link?"}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/signIn')}>
              <Text className="text-[14px] font-[500]  text-emerald-500"> Re-send</Text>
            </Pressable>
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
        </View>
      </View>
    </ScrollView>
  );
}
