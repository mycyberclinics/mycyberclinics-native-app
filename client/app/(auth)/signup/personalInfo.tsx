import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  TextInput,
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

// ✅ Schema for form validation
const ProfileCompletionSchema = BackendUserSchema.pick({
  role: true,
}).extend({
  phone: z.string().regex(/^\+?[0-9\s\-()]{8,20}$/, 'Enter a valid phone number'),
  dob: z.date({
    required_error: 'Date of birth is required',
    invalid_type_error: 'Invalid date format',
  }),
  gender: z.enum(['Male', 'Female', 'Other']),
  location: z.string().min(2, 'Please select a location'),
});

type FormValues = z.infer<typeof ProfileCompletionSchema>;

export default function PersonalInfoScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [genderOpen, setGenderOpen] = useState(false);
  const genderOptions = ['Male', 'Female', 'Other'] as const;

  // 🔍 Location autocomplete states
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const { syncProfile } = useAuthStore();

  // fetch suggestions from Google Places API. fix on location issue yesterday
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
      phone: '',
      dob: new Date(),
      gender: 'Male',
      location: '',
      role: 'patient',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      console.log('[Personal Info Submitted]', data);
      await syncProfile(data);

      if (data.role === 'doctor') {
        router.push('/(auth)/signup/doctorCredential');
      } else {
        router.replace('/(main)/home');
      }
    } catch (error) {
      console.error('[Personal Info] Error syncing:', error);
      setApiError('Failed to save profile. Please try again.');
    }
  };

  return (
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
        <View
          className={`w-full px-6 ${isDark ? 'bg-[#0B0E11]' : 'bg-white'}`}
          style={{ maxWidth: 480 }}
        >
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/(onboarding)/onboardingScreen3')
            }
            className={`mt-2 h-[40px] w-[40px] items-center justify-center rounded-full ${
              isDark ? 'border border-[#2F343A] bg-[#15191E]' : 'bg-[#F3F4F6]'
            }`}
          >
            <Feather name="arrow-left" size={22} color={isDark ? '#fff' : '#111827'} />
          </Pressable>

          <View className="mb-6 mt-4">
            <Text className={`text-[22px] font-[700] ${isDark ? 'text-white' : 'text-[#0B1220]'}`}>
              Almost Done 🎉
            </Text>
            <Text
              className={`mt-2 text-[14px] ${
                isDark ? 'text-text-secondaryDark' : 'text-text-secondaryLight'
              }`}
            >
              We’ll personalize your health journey with a few quick details.
            </Text>
          </View>

          <Text
            className={`mb-2 text-[14px] font-[500] ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            Phone number
          </Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <View
                className={`h-[48px] flex-row items-center rounded-[8px] border px-[12px] ${
                  isDark ? 'border-[#2F343A] bg-[#15191E]' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <Feather name="phone" size={18} color="#9CA3AF" />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="+234 70 896 1234"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  className={`flex-1 px-2 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
                />
              </View>
            )}
          />
          {errors.phone && (
            <Text className="mt-1 text-sm text-red-400">{errors.phone.message}</Text>
          )}

          <View className="mt-4">
            <Text
              className={`mb-2 text-[14px] font-[500] ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Date of birth
            </Text>
            <Controller
              control={control}
              name="dob"
              render={({ field: { value, onChange } }) => (
                <>
                  <Pressable onPress={() => setShowDatePicker(true)}>
                    <View
                      className={`h-[48px] flex-row items-center rounded-[8px] border px-[12px] ${
                        isDark ? 'border-[#2F343A] bg-[#15191E]' : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <Feather name="calendar" size={18} color="#9CA3AF" />
                      <Text className={`flex-1 px-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
            {errors.dob && <Text className="mt-1 text-sm text-red-400">{errors.dob.message}</Text>}
          </View>

          <View className="mt-4">
            <Text
              className={`mb-2 text-[14px] font-[500] ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Gender
            </Text>
            <Controller
              control={control}
              name="gender"
              render={({ field: { value, onChange } }) => (
                <>
                  <Pressable onPress={() => setGenderOpen((s) => !s)}>
                    <View
                      className={`h-[48px] flex-row items-center rounded-[8px] border px-[12px] ${
                        isDark ? 'border-[#2F343A] bg-[#15191E]' : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <Feather name="user" size={18} color="#9CA3AF" />
                      <Text className={`flex-1 px-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                      style={{
                        backgroundColor: isDark ? '#15191E' : '#F3F4F6',
                        borderRadius: 8,
                        marginTop: 4,
                        borderWidth: 1,
                        borderColor: isDark ? '#2F343A' : '#E5E7EB',
                      }}
                    >
                      {genderOptions.map((g) => (
                        <Pressable
                          key={g}
                          onPress={() => {
                            onChange(g);
                            setGenderOpen(false);
                          }}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Feather
                            name={value === g ? 'check-square' : 'square'}
                            size={18}
                            color={value === g ? '#1ED28A' : isDark ? '#9CA3AF' : '#6B7280'}
                          />
                          <Text style={{ color: isDark ? '#FFF' : '#111827', fontSize: 14 }}>
                            {g}
                          </Text>
                        </Pressable>
                      ))}
                    </Animated.View>
                  )}
                </>
              )}
            />
          </View>

          <View className="mt-4">
            <Text
              className={`mb-2 text-[14px] font-[500] ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Location
            </Text>
            <Controller
              control={control}
              name="location"
              render={({ field: { value, onChange } }) => (
                <>
                  <View
                    className={`h-[48px] flex-row items-center rounded-[8px] border px-[12px] ${
                      isDark ? 'border-[#2F343A] bg-[#15191E]' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <Feather name="map-pin" size={18} color="#9CA3AF" />
                    <TextInput
                      value={query}
                      onChangeText={(text) => {
                        setQuery(text);
                        onChange(text);
                      }}
                      placeholder="Type to search location"
                      placeholderTextColor="#9CA3AF"
                      className={`flex-1 px-2 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
                    />
                  </View>

                  {loadingSuggestions ? (
                    <View style={{ paddingVertical: 10 }}>
                      <ActivityIndicator color="#1ED28A" />
                    </View>
                  ) : (
                    suggestions.length > 0 && (
                      <Animated.View
                        entering={FadeIn.duration(300)}
                        exiting={FadeOut.duration(200)}
                        style={{
                          backgroundColor: isDark ? '#15191E' : '#F3F4F6',
                          borderRadius: 8,
                          marginTop: 4,
                          borderWidth: 1,
                          borderColor: isDark ? '#2F343A' : '#E5E7EB',
                        }}
                      >
                        {suggestions.map((item) => (
                          <Pressable
                            key={item.place_id}
                            onPress={() => {
                              onChange(item.description);
                              setQuery(item.description);
                              setSuggestions([]);
                            }}
                            style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                          >
                            <Text
                              style={{
                                color: isDark ? '#FFF' : '#111827',
                                fontSize: 14,
                              }}
                            >
                              {item.description}
                            </Text>
                          </Pressable>
                        ))}
                      </Animated.View>
                    )
                  )}
                  {apiError && <Text className="mt-1 text-sm text-red-400">{apiError}</Text>}
                </>
              )}
            />
          </View>

          <View className="mt-6">
            <Text
              className={`mb-3 text-[14px] font-[500] ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
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
                        className={`h-[44px] flex-1 items-center justify-center rounded-[20px] border ${
                          selected
                            ? 'border-[#1ED28A] bg-[#1ED28A]/10'
                            : isDark
                              ? 'border-[#2F343A] bg-[#15191E]'
                              : 'border-gray-300 bg-gray-50'
                        }`}
                        style={{ flexDirection: 'row', gap: 8 }}
                      >
                        <Checkbox
                          value={selected}
                          onValueChange={() => onChange(role)}
                          color={isDark ? '#10B981' : undefined}
                          className={`${
                            isDark ? 'bg-card-cardBG' : 'bg-card-cardBGLight'
                          } ${isDark ? 'border-text-secondaryLight' : 'border-button-buttonLight'}`}
                        />
                        <Text
                          className={`text-[14px] font-[500] ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {role === 'doctor' ? 'Physician' : 'Patient'}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              ))}
            </View>
          </View>

          <View className="mb-8 mt-10 items-center">
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
  );
}
