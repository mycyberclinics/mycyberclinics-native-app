// import React from 'react';
// import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
// import { useUser } from '@/lib/queries/useUser';
// import { useThemeStore } from '@/store/theme';
// import { useTranslation } from 'react-i18next';
// import { signOutUser } from '@/lib/auth/actions';
// import { useAuthStore } from '@/store/auth';

// export default function DevScreen() {
//   const { t } = useTranslation();
//   const { mode, setMode } = useThemeStore();
//   const { data, isLoading, error } = useUser('123'); // test user

//   const user = useAuthStore((s) => s.user);

//   return (
//     <View
//       className={`flex-1 items-center justify-center ${
//         mode === 'dark' ? 'bg-[#0B0E11]' : 'bg-white'
//       }`}
//     >
//       {/* Translated text */}
//       <Text className={`mb-4 text-xl font-bold ${mode === 'dark' ? 'text-white' : 'text-black'}`}>
//         {t('headline')}
//       </Text>

//       {/* Zustand toggle button */}
//       <TouchableOpacity
//         className="px-6 py-3 mb-4 rounded-full bg-emerald-500"
//         onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
//       >
//         <Text className="font-semibold text-white">Toggle Theme ({mode})</Text>
//       </TouchableOpacity>

//       {/* TanStack Query data example */}
//       {isLoading ? (
//         <ActivityIndicator color="gray" />
//       ) : error ? (
//         <Text className="text-red-500">Error fetching user</Text>
//       ) : (
//         <Text className={`text-base ${mode === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
//           👋 Hello, {data?.name ?? 'Guest'} ({data?.email ?? 'no email'})
//         </Text>
//       )}

//       {user && (
//         <TouchableOpacity className="px-6 py-3 mt-8 bg-gray-300 rounded-full" onPress={signOutUser}>
//           <Text className="font-semibold">Sign Out ({user.email ?? 'Anon'})</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// }


