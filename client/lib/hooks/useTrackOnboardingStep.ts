// import { useEffect } from 'react';
// import { usePathname } from 'expo-router';
// import { useAuthStore } from '@/store/auth';

// /**
//  * automatically track which onboarding step the user is currently on.
//  * so if they close the app, we can resume exactly from there.
//  */
// export function useTrackOnboardingStep() {
//   const pathname = usePathname();
//   const { onboarding, setLastStep, lastStep } = useAuthStore();

//   useEffect(() => {
//     if (onboarding && pathname && pathname !== lastStep) {
//       console.log('[useTrackOnboardingStep] Updating lastStep →', pathname);
//       setLastStep(pathname);
//     }
//   }, [pathname, onboarding, lastStep, setLastStep]);
// }

import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useAuthStore } from '@/store/auth';

/**
 * Automatically track which onboarding step the user is currently on.
 * So if they close the app, we can resume exactly from there.
 */
export function useTrackOnboardingStep() {
  const pathname = usePathname();
  const { onboarding, setLastStep, lastStep, profile } = useAuthStore();

  useEffect(() => {
    // 🧠 Prevent overwriting lastStep once onboarding is done
    if (!onboarding) {
      console.log('[useTrackOnboardingStep] Skipped tracking — onboarding cleared.');
      return;
    }

    // 🧩 Track only signup flow routes
    const isSignupStep = pathname.startsWith('/(main)/home');
    if (isSignupStep && pathname !== lastStep) {
      console.log('[useTrackOnboardingStep] Updating lastStep →', pathname);
      setLastStep(pathname);
    }
  }, [pathname, onboarding, lastStep, setLastStep]);
}
