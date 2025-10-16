// helper used for test. could be edited and used later. don't delete 

import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Animated } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import api from '@/lib/api/client';
import { useAuthStore } from '@/store/auth';

type Props = {
  label: string;
  optional?: boolean;
  onUploaded?: (fileUrl: string) => void;
};

export default function FileUploader({ label, optional = false, onUploaded }: Props) {
  const { syncProfile } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; url: string } | null>(null);
  const fadeAnim = new Animated.Value(0);

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.ms-excel'],
      });

      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      setUploading(true);

   
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      const response = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = response.data?.url;
      console.log('[Uploader] Uploaded:', uploadedUrl);

      // Normalize file type
      let normalizedType: 'doc' | 'audio' | 'video' = 'doc';
      if (file.mimeType?.startsWith('audio')) normalizedType = 'audio';
      else if (file.mimeType?.startsWith('video')) normalizedType = 'video';

      await syncProfile({
        files: [{ fileType: normalizedType, fileUrl: uploadedUrl }],
      });

      setUploadedFile({
        name: file.name,
        size: Math.round(file.size / 1024 / 1024 * 10) / 10,
        url: uploadedUrl,
      });
      onUploaded?.(uploadedUrl);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('[Uploader] Error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    setUploadedFile(null);
    fadeAnim.setValue(0);
  };

  return (
    <View className="my-3">
      <Text className="mb-2 text-[14px] text-gray-300">{label}</Text>

      {uploadedFile ? (
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="flex-row items-center justify-between rounded-md border border-gray-700 bg-[#1A1F25] p-3"
        >
          <View className="flex-row items-center space-x-2">
            <Feather name="file-text" size={18} color="#9CA3AF" />
            <View>
              <Text className="text-white">{uploadedFile.name}</Text>
              <Text className="text-xs text-gray-400">{uploadedFile.size}MB</Text>
            </View>
          </View>
          <Pressable onPress={handleDelete}>
            <Feather name="trash-2" size={18} color="#EF4444" />
          </Pressable>
        </Animated.View>
      ) : (
        <Pressable
          disabled={uploading}
          onPress={handlePick}
          className="h-[100px] items-center justify-center rounded-md border border-dashed border-gray-600 bg-[#111418]"
        >
          {uploading ? (
            <ActivityIndicator color="#1ED28A" />
          ) : (
            <>
              <Feather name="upload-cloud" size={22} color="#9CA3AF" />
              <Text className="mt-2 text-sm text-gray-400">
                Click to upload your document, or image
              </Text>
              <Text className="text-[12px] text-gray-500">
                PDF, PPT, XLS or JPG (max 5MB)
              </Text>
            </>
          )}
        </Pressable>
      )}

      {optional && <Text className="mt-1 text-xs italic text-gray-500">Optional</Text>}
    </View>
  );
}
