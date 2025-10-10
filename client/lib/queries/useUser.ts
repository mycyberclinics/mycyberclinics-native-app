import { useQuery } from '@tanstack/react-query';
// import { api } from '@/lib/api/client';
import { UserSchema, User } from '@/lib/schemas/user';

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async (): Promise<User> => {
      //   const { data } = await api.get(`/users/${userId}`);

      //testing - remove this later
      await new Promise((r) => setTimeout(r, 1000));
      const data = {
        id: userId,
        email: 'khalifa@example.com',
        name: 'Khalifa',
        age: 99,
        role: 'patient',
        fileType: 'video',
      };
      return UserSchema.parse(data);
    },
    enabled: !!userId,
  });
}
