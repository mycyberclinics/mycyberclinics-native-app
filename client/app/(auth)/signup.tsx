import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'expo-router';
import { fetchProfile } from '@/lib/api/client';

type FormValues = { email: string; password: string };

export default function SignUp() {
  const router = useRouter();

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });

  const { signUp, loading, error } = useAuthStore();

  const onSubmit = async (values: FormValues) => {
    // const ok = await signUp(values.email, values.password);
    // if (ok) {
    //   // router.replace('/(auth)/signIn'); // after sending verification + sign out
    //   console.log('User is signed up. AuthGate is taking over...');

    await signUp(values.email, values.password);
    const user = useAuthStore.getState().user;
    if (user) {
      try {
        await fetchProfile(); // <-- backend upsert after signup
      } catch (err) {
        console.error('[SignUp] Backend profile fetch failed:', err);
      }
      router.replace('/(main)/home');
    }
  };

  return (
    <View className="justify-center flex-1 p-6 bg-white">
      <Text className="mb-6 text-2xl font-bold">Create Account</Text>

      {error ? <Text className="mb-3 text-red-600">{error}</Text> : null}

      <Text className="mb-1">Email</Text>
      <Controller
        control={control}
        name="email"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="px-3 py-3 mb-4 border rounded-lg"
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        )}
      />

      <Text className="mb-1">Password</Text>
      <Controller
        control={control}
        name="password"
        rules={{ required: true, minLength: 6 }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="px-3 py-3 mb-6 border rounded-lg"
            value={value}
            onChangeText={onChange}
            secureTextEntry
          />
        )}
      />

      <TouchableOpacity
        className="py-3 rounded-lg bg-emerald-500"
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        <Text className="font-semibold text-center text-white">
          {loading ? 'Creating...' : 'Create Account'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
