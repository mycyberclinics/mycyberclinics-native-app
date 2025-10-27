import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api/client';
import ButtonComponent from '@/components/ButtonComponent';
import { getFirebaseAuth } from '@/lib/firebase';
import { useTrackOnboardingStep } from '@/lib/hooks/useTrackOnboardingStep';
import Toast from 'react-native-toast-message';

type UploadedFile = {
  name: string;
  size: number;
  uri: string;
  type?: string;
  serverUrl?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; 
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.ms-excel',
  'image/jpeg',
  'image/png',
];

export default function DoctorCredentialScreen() {
  const router = useRouter();
  useTrackOnboardingStep();
  const { completeSignUp, syncProfile, setOnboardingComplete } = useAuthStore();

  const colorScheme = useColorScheme();

  const [bio, setBio] = useState('');
  const [mdcnFile, setMdcnFile] = useState<UploadedFile | null>(null);
  const [additionalFile, setAdditionalFile] = useState<UploadedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Inline errors for user feedback
  const [bioError, setBioError] = useState<string | null>(null);
  const [mdcnError, setMdcnError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text1: string, text2?: string) => {
    Toast.show({
      type,
      text1,
      text2,
      visibilityTime: 2500,
    });
  };

  const validateBio = (value: string) => {
    const trimmed = value.trim();
    // Keep validation light to avoid breaking flows; adjust min length as needed
    if (trimmed.length < 10) {
      return 'Please provide a short professional bio (at least 10 characters).';
    }
    return null;
  };

  const validateFile = (file: UploadedFile | null) => {
    if (!file) return 'Your current MDCN Annual Practice License is required.';
    if (file.size && file.size > MAX_FILE_SIZE) return 'File must be 5MB or less.';
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type))
      return 'Unsupported file type. Please upload PDF, PPT, XLS, JPG, or PNG.';
    return null;
  };

  const pickFile = async (setFile: (f: UploadedFile | null) => void, required?: boolean) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_MIME_TYPES,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        if (required) {
          setFile(null);
          setMdcnError('Your current MDCN Annual Practice License is required.');
        }
        return;
      }

      const file = result.assets[0];
      const candidate: UploadedFile = {
        name: file.name,
        size: file.size ?? 0,
        uri: file.uri,
        type: file.mimeType,
      };

      const fileErr = validateFile(candidate);
      if (fileErr) {
        showToast('error', 'Invalid file', fileErr);
        if (required) setMdcnError(fileErr);
        return;
      }

      setFile(candidate);
      if (required) setMdcnError(null);
    } catch (err) {
      console.error('[DoctorCredential] File pick error:', err);
      showToast('error', 'File selection failed', 'Please try again.');
    }
  };

  const uploadDocs = async () => {
    const formData = new FormData();

    formData.append('bio', bio);

    if (mdcnFile) {
      formData.append('mcdnLicense', {
        uri: mdcnFile.uri,
        name: mdcnFile.name,
        type: mdcnFile.type || 'application/pdf',
      } as any);
    }

    if (additionalFile) {
      formData.append('additionalQualification', {
        uri: additionalFile.uri,
        name: additionalFile.name,
        type: additionalFile.type || 'application/pdf',
      } as any);
    }

    const auth = getFirebaseAuth();
    const token = await auth.currentUser?.getIdToken();

    if (!token) throw new Error('No auth token found — user not logged in.');

    console.log('[DoctorCredential] Uploading docs with token...');

    const response = await api.post('/api/profile/upload-doc', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('[Doctor Credential Check: ', response.data);
    console.log('[DoctorCredential] Upload success:', response.status);
    return response.data;
  };

  const handleContinue = async () => {
    setGeneralError(null);
    // Validate inputs before any network call
    const bioErr = validateBio(bio);
    const fileErr = validateFile(mdcnFile);

    setBioError(bioErr);
    setMdcnError(fileErr);

    if (bioErr || fileErr) {
      showToast('error', 'Please fix the issues', 'Check your bio and required document.');
      return;
    }

    try {
      setLoading(true);

      // Upload documents
      await uploadDocs();

      // Sync bio (keep as a separate call/update for compatibility with existing flow)
      try {
        await syncProfile({ bio });
      } catch (syncErr) {
        console.warn('[DoctorCredential] syncProfile warning:', syncErr);
        // Do not block onboarding completion if docs were uploaded successfully
      }

      // mark onboarding complete (sets onboarding=false, etc.)
      setOnboardingComplete();

      // mark app state clean
      completeSignUp();

      setSuccess(true);
      showToast('success', 'Verification Complete!', 'Redirecting to your dashboard...');

      setTimeout(() => {
        router.replace('/(main)/home');
      }, 1200);
    } catch (err: any) {
      console.error('[DoctorCredential] Submit error:', err);

      // Try to parse server error message if present
      const serverMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong while uploading your credentials.';

      setGeneralError(serverMessage);
      showToast('error', 'Upload failed', serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(200)}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        <View className="flex-1 bg-white px-6 dark:bg-[#0B0E11]">
          <View className="mt-8">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(auth)/signup/personalInfo');
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

          <View className="mt-6 mb-4">
            <Text className="text-[18px] font-[700] text-[#0B1220] dark:text-white">
              Hi Doctor, Verify Your Medical Credentials
            </Text>
            <Text className="mt-2 text-[13px] leading-5 text-text-secondaryLight dark:text-text-secondaryDark">
              To protect our patients and maintain high standards, we require licensed practitioners
              to upload relevant documentation.
            </Text>
          </View>

          <Text className="mb-2 text-[14px] font-[500] text-gray-900 dark:text-white">Bio</Text>
          <TextInput
            value={bio}
            onChangeText={(t) => {
              setBio(t);
              if (bioError) setBioError(null);
            }}
            placeholder="Enter your bio..."
            placeholderTextColor="#9CA3AF"
            multiline
            className="min-h[100px] min-h-[100px] rounded-[8px] border border-gray-300 bg-gray-50 px-3 py-3 text-[14px] text-gray-900 dark:border-[#2F343A] dark:bg-[#15191E] dark:text-white"
          />
          {bioError ? <Text className="mt-1 text-[12px] text-red-500">{bioError}</Text> : null}

          <View className="mt-6">
            <Text className="mb-2 text-[14px] font-[500] text-gray-900 dark:text-white">
              Current MDCN Annual Practice License – Required
            </Text>
            <Pressable
              onPress={() => pickFile(setMdcnFile, true)}
              className="h-[120px] items-center justify-center rounded-[8px] border border-gray-300 bg-gray-50 dark:border-[#2F343A] dark:bg-[#15191E]"
            >
              <Feather name="upload-cloud" size={24} color="#9CA3AF" />
              <Text className="mt-2 text-[13px] font-[500] text-[#1ED28A]">Click to upload</Text>
              <Text className="text-[12px] text-gray-400">PDF, PPT, XLS or JPG/PNG (max 5MB)</Text>
            </Pressable>
            {mdcnError ? <Text className="mt-1 text-[12px] text-red-500">{mdcnError}</Text> : null}

            {mdcnFile && (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                className="mt-3 w-full flex-row items-center justify-between rounded-[8px] border border-gray-300 px-3 py-2 dark:border-[#2F343A]"
              >
                <View className="w-[274px] flex-row items-center gap-2">
                  <Feather name="file-text" size={18} color="#9CA3AF" />
                  <View className="w-[254px] ">
                    <Text className="text-[14px] text-gray-900 dark:text-white ">
                      {mdcnFile.name}
                    </Text>
                    <Text className="text-[12px] text-gray-500">
                      {((mdcnFile.size ?? 0) / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    setMdcnFile(null);
                    setMdcnError('Your current MDCN Annual Practice License is required.');
                  }}
                >
                  <Feather name="trash-2" size={18} color="red" />
                </Pressable>
              </Animated.View>
            )}
          </View>

          <View className="mt-6">
            <Text className="mb-2 text-[14px] font-[500] text-gray-900 dark:text-white">
              Additional Qualification (optional)
            </Text>
            <Pressable
              onPress={() => pickFile(setAdditionalFile)}
              className="h-[120px] items-center justify-center rounded-[8px] border border-gray-300 bg-gray-50 dark:border-[#2F343A] dark:bg-[#15191E]"
            >
              <Feather name="upload-cloud" size={24} color="#9CA3AF" />
              <Text className="mt-2 text-[13px] font-[500] text-[#1ED28A]">Click to upload</Text>
              <Text className="text-[12px] text-gray-400">PDF, PPT, XLS or JPG/PNG (max 5MB)</Text>
            </Pressable>

            {additionalFile && (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                className="mt-3 flex-row items-center justify-between rounded-[8px] border border-gray-300 px-3 py-2 dark:border-[#2F343A]"
              >
                <View className="flex-row items-center gap-2">
                  <Feather name="file-text" size={18} color="#9CA3AF" />
                  <View className="w-[254px] ">
                    <Text className="text-[14px] text-gray-900 dark:text-white">
                      {additionalFile.name}
                    </Text>
                    <Text className="text-[12px] text-gray-500">
                      {((additionalFile.size ?? 0) / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => setAdditionalFile(null)}>
                  <Feather name="trash-2" size={18} color="red" />
                </Pressable>
              </Animated.View>
            )}
          </View>

          {generalError ? (
            <View className="mt-6 rounded-[8px] border border-red-300 bg-red-50 px-3 py-2 dark:border-red-400/40 dark:bg-red-900/20">
              <Text className="text-[12px] text-red-600 dark:text-red-300">{generalError}</Text>
            </View>
          ) : null}

          <View className="items-center mt-10 mb-6">
            <ButtonComponent
              title="Continue"
              onPress={handleContinue}
              loading={loading}
              disabled={!mdcnFile || loading}
              style={{ width: 328, borderRadius: 999 }}
            />
          </View>
        </View>
      </ScrollView>

      {success && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          className="absolute inset-0 items-center justify-center bg-black/60"
        >
          <Animated.View
            entering={ZoomIn.duration(500)}
            exiting={ZoomOut.duration(300)}
            className="items-center"
          >
            <View className="mb-3 h-[80px] w-[80px] items-center justify-center rounded-full bg-[#1ED28A]">
              <Feather name="check" size={38} color="#fff" />
            </View>
            <Text className="text-[18px] font-[600] text-white">Verification Complete!</Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* Toast portal */}
      <Toast />
    </Animated.View>
  );
}
