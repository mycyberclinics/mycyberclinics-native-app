import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
  useColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/Checkbox';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import ButtonComponent from '@/components/ButtonComponent';
import { BackendUserSchema } from '@/lib/schemas/user';
import { useAuthStore } from '@/store/auth';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import api from '@/lib/api/client';
import Toast from 'react-native-toast-message';
import { updateProfile } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useTrackOnboardingStep } from '@/lib/hooks/useTrackOnboardingStep';

const ProfileCompletionSchema = BackendUserSchema.pick({
  role: true,
}).extend({
  displayName: z.string(),
  phone: z.string().regex(/^\+?[0-9\s\-()]{8,20}$/, 'Enter a valid phone number'),
  dob: z.date(),
  gender: z.enum(['Male', 'Female', 'Other']),
  location: z.string().min(2, 'Please select a location'),
});

type FormValues = z.infer<typeof ProfileCompletionSchema>;

export default function PersonalInfoScreen() {
  useTrackOnboardingStep();
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [genderOpen, setGenderOpen] = useState(false);
  const genderOptions = ['Male', 'Female', 'Other'] as const;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const { syncProfile, setOnboardingComplete, completeSignUp } = useAuthStore();

  const colorScheme = useColorScheme();
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  // Google Places autocomplete
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setLoadingSuggestions(true);
        const key = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query,
        )}&key=${key}&language=en&components=country:ng`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'OK') {
          setSuggestions(data.predictions);
          setApiError(null);
        } else {
          setSuggestions([]);
          setApiError('No locations found or API error.');
        }
      } catch (err) {
        console.error('❌ Failed to fetch suggestions:', err);
        setApiError('Could not connect to Google Places API.');
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(ProfileCompletionSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      phone: '',
      dob: new Date(),
      gender: 'Male',
      location: '',
      role: 'patient',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setApiError(null);
      console.log('[Personal Info Submitted]', data);

      if (currentUser && data.displayName) {
        try {
          await updateProfile(currentUser, { displayName: data.displayName });
          console.log('[PersonalInfo] displayName updated in Firebase:', data.displayName);
        } catch (err) {
          console.warn('[PersonalInfo] updateProfile failed:', err);
        }
      }

      const payload = {
        displayName: data.displayName,
        phone: data.phone,
        dob: data.dob.toISOString(),
        gender: data.gender,
        location: data.location,
        accountType: data.role === 'doctor' ? 'physician' : 'patient',
        bio: '',
      };

      const response = await api.post('/api/profile/complete', payload); 
      console.log('[Profile Complete Response]', response.data);

      setOnboardingComplete();
      await syncProfile({ ...data, role: data.role });
      completeSignUp();

      Toast.show({
        type: 'success',
        text1: 'Profile saved successfully 🎉',
        text2:
          data.role === 'doctor'
            ? 'Next, upload your professional credentials.'
            : 'Redirecting to your dashboard...',
        visibilityTime: 2500,
      });

      const normalizedRole = data.role === 'doctor' ? 'physician' : data.role;

      if (normalizedRole === 'physician') {
        router.push('/(auth)/signup/doctorCredential');
      } else {
        // await api.post('/profile', data);
        useAuthStore.setState({ onboarding: false });
        console.log('[PersonalInfo] ✅ Onboarding complete, redirecting to home');

        router.replace('/(main)/home');
      }
    } catch (error: any) {
      console.error('[Personal Info] Error syncing:', error?.response?.data || error);
      const message =
        error?.response?.data?.error ||
        'Failed to save profile. Please check your internet connection and try again.';
      setApiError(message);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
    }
  };

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: Platform.OS === 'web' ? 60 : 40,
          }}
        >
          <View className="w-full bg-white px-6 dark:bg-[#0B0E11]" style={{ maxWidth: 480 }}>
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(auth)/signup/personalInfo'); //user shouldn't go back after verifying email
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

            <View className="mt-4 mb-6">
              <Text className="text-[22px] font-[700] text-[#0B1220] dark:text-white">
                Almost Done 🎉
              </Text>
              <Text className="mt-2 text-[14px] text-text-secondaryLight dark:text-text-secondaryDark">
                We’ll personalize your health journey with a few quick details.
              </Text>
            </View>

            <Text className="mb-2 text-[14px] font-[500] text-gray-900 dark:text-white">Full Name</Text>
            <Controller
              control={control}
              name="displayName"
              render={({ field: { value, onChange } }) => (
                <View className="h-[48px] flex-row items-center rounded-[8px] border border-gray-300 bg-gray-50 px-[12px] dark:border-[#2F343A] dark:bg-[#15191E]">
                  <Feather name="user" size={18} color="#9CA3AF" />
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Name"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="default"
                    className="flex-1 px-2 py-3 mb-2 text-gray-900 dark:text-white"
                  />
                </View>
              )}
            />
            {errors.displayName && (
              <Text className="mt-1 text-sm text-red-400">{errors.displayName.message}</Text>
            )}

            <Text className="mb-2 text-[14px] font-[500] text-gray-900 dark:text-white">
              Phone number
            </Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { value, onChange } }) => (
                <View className="h-[48px] flex-row items-center rounded-[8px] border border-gray-300 bg-gray-50 px-[12px] dark:border-[#2F343A] dark:bg-[#15191E]">
                  <Feather name="phone" size={18} color="#9CA3AF" />
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="+234 70 896 1234"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="flex-1 px-2 py-3 text-gray-900 dark:text-white"
                  />
                </View>
              )}
            />
            {errors.phone && (
              <Text className="mt-1 text-sm text-red-400">{errors.phone.message}</Text>
            )}

            <View className="mt-4">
              <Text className="mb-2 text-[14px] font-[500] text-gray-900 dark:text-white">
                Date of birth
              </Text>
              <Controller
                control={control}
                name="dob"
                render={({ field: { value, onChange } }) => (
                  <>
                    <Pressable onPress={() => setShowDatePicker(true)}>
                      <View className="h-[48px] flex-row items-center rounded-[8px] border border-gray-300 bg-gray-50 px-[12px] dark:border-[#2F343A] dark:bg-[#15191E]">
                        <Feather name="calendar" size={18} color="#9CA3AF" />
                        <Text className="flex-1 px-2 text-gray-900 dark:text-white">
                          {value ? value.toDateString() : 'Select date of birth'}
                        </Text>
                        <Feather name="chevron-down" size={18} color="#9CA3AF" />
                      </View>
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        value={value || new Date()}
                        mode="date"
                        display="spinner"
                        maximumDate={new Date()}
                        onChange={(_, date) => {
                          setShowDatePicker(false);
                          if (date) onChange(date);
                        }}
                      />
                    )}
                  </>
                )}
              />
              {errors.dob && (
                <Text className="mt-1 text-sm text-red-400">{errors.dob.message}</Text>
              )}
            </View>

            <View className="mt-4">
              <Text className="mb-2 text-[14px] font-[500] text-gray-900 dark:text-white">
                Gender
              </Text>
              <Controller
                control={control}
                name="gender"
                render={({ field: { value, onChange } }) => (
                  <>
                    <Pressable onPress={() => setGenderOpen((s) => !s)}>
                      <View className="h-[48px] flex-row items-center rounded-[8px] border border-gray-300 bg-gray-50 px-[12px] dark:border-[#2F343A] dark:bg-[#15191E]">
                        <Feather name="user" size={18} color="#9CA3AF" />
                        <Text className="flex-1 px-2 text-gray-900 dark:text-white">
                          {value || 'Select Gender'}
                        </Text>
                        <Feather
                          name={genderOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#9CA3AF"
                        />
                      </View>
                    </Pressable>
                    {genderOpen && (
                      <Animated.View
                        entering={FadeIn.duration(300)}
                        exiting={FadeOut.duration(200)}
                        className="mt-1 rounded-lg border border-gray-300 bg-gray-50 dark:border-[#2F343A] dark:bg-[#15191E]"
                      >
                        {genderOptions.map((g) => (
                          <Pressable
                            key={g}
                            onPress={() => {
                              onChange(g);
                              setGenderOpen(false);
                            }}
                            className="flex-row items-center gap-2 px-3 py-2"
                          >
                            <Feather
                              name={value === g ? 'check-square' : 'square'}
                              size={18}
                              color={value === g ? '#1ED28A' : '#9CA3AF'}
                            />
                            <Text className="text-[14px] text-gray-900 dark:text-white">{g}</Text>
                          </Pressable>
                        ))}
                      </Animated.View>
                    )}
                  </>
                )}
              />
            </View>

            <View className="mt-4">
              <Text className="mb-2 text-[14px] font-[500] text-gray-900 dark:text-white">
                Location
              </Text>
              <Controller
                control={control}
                name="location"
                render={({ field: { onChange } }) => (
                  <>
                    <View className="h-[48px] flex-row items-center rounded-[8px] border border-gray-300 bg-gray-50 px-[12px] dark:border-[#2F343A] dark:bg-[#15191E]">
                      <Feather name="map-pin" size={18} color="#9CA3AF" />
                      <TextInput
                        value={query}
                        onChangeText={(text) => {
                          setQuery(text);
                          onChange(text);
                        }}
                        placeholder="Type to search location"
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 px-2 py-3 text-gray-900 dark:text-white"
                      />
                    </View>

                    {loadingSuggestions ? (
                      <View className="py-3">
                        <ActivityIndicator color="#1ED28A" />
                      </View>
                    ) : (
                      suggestions.length > 0 && (
                        <Animated.View
                          entering={FadeIn.duration(300)}
                          exiting={FadeOut.duration(200)}
                          className="mt-1 rounded-lg border border-gray-300 bg-gray-50 dark:border-[#2F343A] dark:bg-[#15191E]"
                        >
                          {suggestions.map((item) => (
                            <Pressable
                              key={item.place_id}
                              onPress={() => {
                                onChange(item.description);
                                setQuery(item.description);
                                setSuggestions([]);
                              }}
                              className="px-3 py-2"
                            >
                              <Text className="text-[14px] text-gray-900 dark:text-white">
                                {item.description}
                              </Text>
                            </Pressable>
                          ))}
                        </Animated.View>
                      )
                    )}
                  </>
                )}
              />
            </View>

            <View className="mt-6">
              <Text className="mb-3 text-[14px] font-[500] text-gray-900 dark:text-white">
                Account Type
              </Text>
              <View className="flex-row gap-3">
                {(['patient', 'doctor'] as const).map((role) => (
                  <Controller
                    key={role}
                    control={control}
                    name="role"
                    render={({ field: { value, onChange } }) => {
                      const selected = value === role;
                      return (
                        <Pressable
                          onPress={() => onChange(role)}
                          className={`h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-[20px] border ${
                            selected
                              ? 'border-[#1ED28A] bg-[#1ED28A]/10'
                              : 'border-gray-300 bg-gray-50 dark:border-[#2F343A] dark:bg-[#15191E]'
                          }`}
                        >
                          <Checkbox
                            value={selected}
                            onValueChange={() => onChange(role)}
                            color="#10B981"
                          />
                          <Text className="text-[14px] font-[500] text-gray-900 dark:text-white">
                            {role === 'doctor' ? 'Physician' : 'Patient'}
                          </Text>
                        </Pressable>
                      );
                    }}
                  />
                ))}
              </View>
            </View>

            <View className="items-center mt-10 mb-8">
              <ButtonComponent
                title="Continue"
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid || isSubmitting}
                loading={isSubmitting}
                style={{ width: 328, borderRadius: 999 }}
              />
            </View>
          </View>
        </ScrollView>
      </Animated.View>
      <Toast />
    </>
  );
}
