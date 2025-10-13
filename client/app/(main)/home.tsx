//this is a test screen. it is suppsoed to fetch user profile from BE
// it is a protected route ⚡

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import api from '@/lib/api/client';

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setError(null);
      const res = await api.get('/api/profile');
      setProfile(res.data.user);
    } catch (err: any) {
      console.error('[API] profile fetch failed', err.response?.data || err);
      setError(err.message);
    }
  };

  return (
    <View className="items-center justify-center flex-1 gap-8 bg-white">
      <View className="w-full ">
        <Text className="w-full text-2xl text-center "> WELCOME TO MY DASHBOARD 🎉</Text>
      </View>
      <TouchableOpacity onPress={fetchProfile} className="px-6 py-3 mb-4 rounded-lg bg-emerald-500">
        <Text className="font-semibold text-white">Fetch Profile</Text>
      </TouchableOpacity>

      {profile && <Text className="px-4 text-center">{JSON.stringify(profile, null, 2)}</Text>}
      {error && <Text className="text-red-500">{error}</Text>}
    </View>
  );
}

// import React, { useEffect, useState } from 'react';
// import { View, Text } from 'react-native';
// import { fetchProfile } from '@/lib/api/client';

// export default function HomeScreen() {
//   const [profile, setProfile] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         const data = await fetchProfile();
//         setProfile(data);
//       } catch (e: any) {
//         setError(e.message);
//       }
//     })();
//   }, []);

//   if (error) {
//     return (
//       <View className="items-center justify-center flex-1 bg-red-50">
//         <Text className="text-red-500">Error: {error}</Text>
//       </View>
//     );
//   }

//   return (
//     <View className="items-center justify-center flex-1">
//       {profile ? (
//         <Text className="text-lg font-semibold text-emerald-600">
//           Welcome, {profile.user?.email || 'User'} 👋
//         </Text>
//       ) : (
//         <Text className="text-gray-500">Loading profile...</Text>
//       )}
//     </View>
//   );
// }
