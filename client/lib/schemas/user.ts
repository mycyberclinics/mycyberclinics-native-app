import { z } from 'zod';
import disposableDomains from 'disposable-email-domains';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  email: z.email('Invalid email address').refine((val) => {
    const domain = val.split('@')[1];
    return !disposableDomains.includes(domain);
  }, 'Disposable email addresses are not allowed'),
  password: z
    .string()
    .min(8)
    .refine((val) => /[A-Z]/.test(val), 'Must contain uppercase letter')
    .refine((val) => /[a-z]/.test(val), 'Must contain lowercase letter')
    .refine((val) => /[0-9]/.test(val), 'Must contain a number')
    .refine((val) => /[^A-Za-z0-9]/.test(val), 'Must contain special character')
    .optional(),
  age: z.number().int().min(8, 'You must be at least 8 years old'),
  role: z.enum(['doctor', 'patient']).optional().default('patient'),
  fileType: z.enum(['doc', 'audio', 'video']).optional(),
  fileUrl: z.url('Invalid file URL').optional(),
  createdAt: z.date().default(() => new Date()),
});
export type User = z.infer<typeof UserSchema>;
