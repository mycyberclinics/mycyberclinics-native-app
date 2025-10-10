import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'expo-router';

type FormValues = { email: string; password: string };

export default function SignIn() {
  const router = useRouter();
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });

  const { signIn, loading, error } = useAuthStore();

  const onSubmit = async (values: FormValues) => {
    await signIn(values.email, values.password);
    const user = useAuthStore.getState().user;
    if (user) router.replace('/(main)/home');
  };

  const onGuest = async () => {
    // treat guest as a sign-in with fixed email
    await signIn('guest@mycyberclinics.com', 'guest-pass');
    const user = useAuthStore.getState().user;
    if (user) router.replace('/(main)/home');
  };

  return (
    <View className="justify-center flex-1 p-6 bg-white">
      <Text className="mb-6 text-2xl font-bold">Sign In</Text>

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
        className="py-3 mb-3 rounded-lg bg-emerald-500"
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        <Text className="font-semibold text-center text-white">
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="py-3 bg-gray-200 rounded-lg"
        onPress={onGuest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text className="font-semibold text-center">Continue as Guest</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity className="mt-6" onPress={() => router.push('/(auth)/signup')}>
        <Text className="text-center text-emerald-600">Create an account</Text>
      </TouchableOpacity>
    </View>
  );
}
