import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useAuthStore } from '@/store/auth';

export default function MainLayout() {
  const router = useRouter();
  const {
    user,
    onboarding,
    lastStep,
    setUser,
    initializing,
    rehydrate,
    // hasSeenIntro,
    // setHasSeenIntro,
  } = useAuthStore();
  const [rehydrated, setRehydrated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Rehydrate Zustand store once on app load
  useEffect(() => {
    (async () => {
      try {
        await rehydrate();
        setRehydrated(true);
      } catch (err) {
        console.error('[MainLayout] Rehydrate error:', err);
        setRehydrated(true);
      }
    })();
  }, [rehydrate]);

  // Firebase Auth state listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [setUser]);

  // Routing logic based on user, onboarding, and lastStep
  useEffect(() => {
    if (initializing || !rehydrated || checkingAuth) return;

    console.log('[MainLayout] Deciding navigation...', {
      user: user?.email,
      onboarding: false,
      lastStep: null,
    });

    try {
      if (user) {
        // if (!hasSeenIntro) {
        //   router.replace('/(onboarding)/onboardingScreen1');
        // }
        if (!user) {
          router.replace('/(auth)/signIn');
        } else if (onboarding && lastStep) {
          // Resume from the last onboarding step
          router.replace(lastStep as any);
        } else if (onboarding && !lastStep) {
          // Start onboarding at first step if no lastStep
          router.replace('/(auth)/signup/emailPassword');
        } else if (!onboarding) {
          // Fully onboarded → go home
          router.replace('/(main)/home');
        }
      }
    } catch (error: any) {
      console.error('[MainLayout] routung error:', error);
    }
  }, [
    user,
    onboarding,
    lastStep,
    initializing,
    rehydrated,
    checkingAuth,
    router,
    // hasSeenIntro,
    // setHasSeenIntro,
  ]);

  // Loader while checking auth or rehydrating
  if (checkingAuth || initializing || !rehydrated) {
    return (
      <View className="items-center justify-center flex-1 bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#1ED28A" />
        <Text className="mt-3 text-gray-500 dark:text-gray-300">Preparing app...</Text>
      </View>
    );
  }

  // Default render: slot for children
  return (
    <View className="flex-1">
      <Slot />
      <Toast position="bottom" />
    </View>
  );
}

// import React, { useEffect, useState } from 'react';
// import { View, ActivityIndicator, Text } from 'react-native';
// import { Slot, useRouter } from 'expo-router';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';
// import { Toast } from 'react-native-toast-message/lib/src/Toast';
// import { useAuthStore } from '@/store/auth';

// export default function MainLayout() {
//   const router = useRouter();
//   const { user, onboarding, lastStep, setUser, initializing, rehydrate, hasSeenIntro, loading } =
//     useAuthStore();

//   const [rehydrated, setRehydrated] = useState(false);
//   const [checkingAuth, setCheckingAuth] = useState(true);

//   // Rehydrate store
//   useEffect(() => {
//     (async () => {
//       console.log('[MainLayout] Starting rehydrate...');
//       try {
//         await rehydrate();
//         setRehydrated(true);
//         console.log('[MainLayout] ✅ rehydrate() done → rehydrated = true');
//       } catch (err) {
//         console.error('[MainLayout] ❌ rehydrate error:', err);
//         setRehydrated(true);
//       }
//     })();
//   }, [rehydrate]);

//   // Firebase auth listener
//   useEffect(() => {
//     const auth = getAuth();
//     const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
//       console.log('[MainLayout] 🔄 Firebase state changed:', firebaseUser?.email || 'no user');
//       setUser(firebaseUser || null);
//       setCheckingAuth(false);
//     });
//     return () => unsubscribe();
//   }, [setUser]);

//   // Routing decision
//   useEffect(() => {
//     console.log('[MainLayout] useEffect triggered:', {
//       initializing,
//       rehydrated,
//       checkingAuth,
//       loading,
//       user: user?.email || null,
//       hasSeenIntro,
//       onboarding,
//       lastStep,
//     });

//     if (!rehydrated || initializing || loading || checkingAuth) {
//       console.log(
//         '[MainLayout] ⏳ waiting: rehydrated?',
//         rehydrated,
//         'init?',
//         initializing,
//         'loading?',
//         loading,
//         'checkAuth?',
//         checkingAuth,
//       );
//       return;
//     }

//     console.log('[MainLayout] 🚦 deciding route...');

//     try {
//       if (user) {
//         if (!hasSeenIntro) {
//           console.log('[MainLayout] → route to onboardingCarousel');
//           router.replace('/(onboarding)/onboardingCarousel');
//         } else if (onboarding && lastStep) {
//           console.log('[MainLayout] → resume onboarding at', lastStep);
//           router.replace(lastStep as any);
//         } else {
//           console.log('[MainLayout] → user onboarded → go home');
//           router.replace('/(main)/home');
//         }
//       } else {
//         if (!hasSeenIntro) {
//           console.log('[MainLayout] → no user, show onboardingCarousel');
//           router.replace('/(onboarding)/onboardingCarousel');
//         } else {
//           console.log('[MainLayout] → no user, go to signup');
//           router.replace('/(auth)/signup/emailPassword');
//         }
//       }
//     } catch (err) {
//       console.error('[MainLayout] Routing error:', err);
//     }
//   }, [
//     user,
//     onboarding,
//     lastStep,
//     initializing,
//     rehydrated,
//     checkingAuth,
//     loading,
//     hasSeenIntro,
//     router,
//   ]);

//   if (checkingAuth || initializing || !rehydrated || loading) {
//     return (
//       <View className="items-center justify-center flex-1 bg-white dark:bg-black">
//         <ActivityIndicator size="large" color="#1ED28A" />
//         <Text className="mt-3 text-gray-500 dark:text-gray-300">Hold on a moment. Preparing app...</Text>
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1">
//       <Slot />
//       <Toast position="bottom" />
//     </View>
//   );
// }
