import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api/client';
import ButtonComponent from '@/components/ButtonComponent';

type UploadedFile = {
  name: string;
  size: number;
  uri: string;
  type?: string;
};

export default function DoctorCredentialScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { syncProfile, completeSignUp } = useAuthStore();

  const [bio, setBio] = useState('');
  const [mdcnFile, setMdcnFile] = useState<UploadedFile | null>(null);
  const [additionalFile, setAdditionalFile] = useState<UploadedFile | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle file pick
  const pickFile = async (setFile: (f: UploadedFile | null) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.ms-powerpoint',
          'application/vnd.ms-excel',
          'image/jpeg',
          'image/png',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      setFile({
        name: file.name,
        size: file.size ?? 0,
        uri: file.uri,
        type: file.mimeType,
      });
    } catch (err) {
      console.error('[DoctorCredential] File pick error:', err);
    }
  };

  // simulated API file upload
  const uploadFile = async (file: UploadedFile, field: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type || 'application/pdf',
    } as any);

    formData.append('fileType', field);

    const response = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.url;
  };

  const handleContinue = async () => {
    try {
      setLoading(true);

      let mdcnUrl = '';
      let additionalUrl = '';

      if (mdcnFile) {
        mdcnUrl = await uploadFile(mdcnFile, 'doc');
      }

      if (additionalFile) {
        additionalUrl = await uploadFile(additionalFile, 'doc');
      }

      await syncProfile({
        role: 'doctor',
        bio,
        files: [
          ...(mdcnUrl ? [{ fileType: 'doc', fileUrl: mdcnUrl }] : []),
          ...(additionalUrl ? [{ fileType: 'doc', fileUrl: additionalUrl }] : []),
        ],
      });

      completeSignUp();
      router.replace('/(main)/home');
    } catch (err) {
      console.error('[DoctorCredential] Submit error:', err);
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
        <View className={`flex-1 px-6 ${isDark ? 'bg-[#0B0E11]' : 'bg-white'}`}>
          <View className="mt-8">
            <Pressable
              onPress={() => router.back()}
              className={`flex h-[40px] w-[40px] items-center justify-center rounded-full ${
                isDark ? 'border border-[#2F343A] bg-[#15191E]' : 'bg-[#F3F4F6]'
              }`}
            >
              <Feather name="arrow-left" size={22} color={isDark ? '#fff' : '#111827'} />
            </Pressable>
          </View>

          <View className="mb-4 mt-6">
            <Text className={`text-[18px] font-[700] ${isDark ? 'text-white' : 'text-[#0B1220]'}`}>
              Hi Doctor, Verify Your Medical Credentials
            </Text>
            <Text
              className={`mt-2 text-[13px] leading-5 ${
                isDark ? 'text-text-secondaryDark' : 'text-text-secondaryLight'
              }`}
            >
              To protect our patients and maintain high standards, we require licensed practitioners
              to upload relevant documentation.
            </Text>
          </View>

          <Text
            className={`mb-2 text-[14px] font-[500] ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            Bio
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Enter your bio..."
            placeholderTextColor="#9CA3AF"
            multiline
            className={`min-h-[100px] rounded-[8px] border px-3 py-3 text-[14px] ${
              isDark
                ? 'border-[#2F343A] bg-[#15191E] text-white'
                : 'border-gray-300 bg-gray-50 text-gray-900'
            }`}
          />

          <View className="mt-6">
            <Text
              className={`mb-2 text-[14px] font-[500] ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Current MDCN Annual Practice License (to be updated yearly in Q1) – Required
            </Text>
            <Pressable
              onPress={() => pickFile(setMdcnFile)}
              className={`h-[120px] items-center justify-center rounded-[8px] border ${
                isDark ? 'border-[#2F343A] bg-[#15191E]' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Feather name="upload-cloud" size={24} color="#9CA3AF" />
              <Text className="mt-2 text-[13px] font-[500] text-[#1ED28A]">Click to upload</Text>
              <Text className="text-[12px] text-gray-400">PDF, PPT, XLS or JPG (max 5mb)</Text>
            </Pressable>

            {mdcnFile && (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                className={`mt-3 flex-row items-center justify-between rounded-[8px] border px-3 py-2 ${
                  isDark ? 'border-[#2F343A]' : 'border-gray-300'
                }`}
              >
                <View className="flex-row items-center gap-2">
                  <Feather name="file-text" size={18} color="#9CA3AF" />
                  <View>
                    <Text className={`text-[14px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {mdcnFile.name}
                    </Text>
                    <Text className="text-[12px] text-gray-500">
                      {(mdcnFile.size / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => setMdcnFile(null)}>
                  <Feather name="trash-2" size={18} color="red" />
                </Pressable>
              </Animated.View>
            )}
          </View>

          <View className="mt-6">
            <Text
              className={`mb-2 text-[14px] font-[500] ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Additional Qualification (Part I/II or Primary Certificate)
              {'\n'}for Resident/Consultant placement (optional)
            </Text>
            <Pressable
              onPress={() => pickFile(setAdditionalFile)}
              className={`h-[120px] items-center justify-center rounded-[8px] border ${
                isDark ? 'border-[#2F343A] bg-[#15191E]' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Feather name="upload-cloud" size={24} color="#9CA3AF" />
              <Text className="mt-2 text-[13px] font-[500] text-[#1ED28A]">Click to upload</Text>
              <Text className="text-[12px] text-gray-400">PDF, PPT, XLS or JPG (max 5mb)</Text>
            </Pressable>

            {additionalFile && (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                className={`mt-3 flex-row items-center justify-between rounded-[8px] border px-3 py-2 ${
                  isDark ? 'border-[#2F343A]' : 'border-gray-300'
                }`}
              >
                <View className="flex-row items-center gap-2">
                  <Feather name="file-text" size={18} color="#9CA3AF" />
                  <View>
                    <Text className={`text-[14px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {additionalFile.name}
                    </Text>
                    <Text className="text-[12px] text-gray-500">
                      {(additionalFile.size / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => setAdditionalFile(null)}>
                  <Feather name="trash-2" size={18} color="red" />
                </Pressable>
              </Animated.View>
            )}
          </View>

          <View className="mb-6 mt-10 items-center">
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
    </Animated.View>
  );
}
