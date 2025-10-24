import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '@/lib/api/client';
import { BackendUserSchema, BackendUser } from '@/lib/schemas/user';

export function useUser() {
  return useQuery<BackendUser>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await fetchProfile();
      console.log('[Tanstak Query] Unable to fetch user profile');
      return BackendUserSchema.parse(user);
    },
  });
}
