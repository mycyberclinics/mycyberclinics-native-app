import { z } from 'zod';

export const BackendUserSchema = z.object({
  _id: z.string().optional(),
  uid: z.string().optional(),
  email: z.email(),
  bio: z.string().max(500).optional(),
  role: z.enum(['doctor', 'patient']).default('patient'),
  age: z.number().int().optional(),
  name: z.string().optional(),
  files: z
    .array(
      z.object({
        fileType: z.enum(['doc', 'audio', 'video']).optional(),
        fileUrl: z.string().url().optional(),
      }),
    )
    .optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type BackendUser = z.infer<typeof BackendUserSchema>;

export const SignupFormSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
});
export type SignupForm = z.infer<typeof SignupFormSchema>;
