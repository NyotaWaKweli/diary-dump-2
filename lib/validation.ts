import { z } from 'zod';

// Instagram-style username: lowercase letters, numbers, underscores, dots only
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-z0-9._]+$/, 'Username can only contain lowercase letters, numbers, underscores, and dots')
  .refine((val) => !val.startsWith('.') && !val.startsWith('_'), 'Username cannot start with . or _')
  .refine((val) => !val.endsWith('.') && !val.endsWith('_'), 'Username cannot end with . or _')
  .refine((val) => !val.includes('..'), 'Username cannot contain consecutive dots')
  .refine((val) => !val.includes('__'), 'Username cannot contain consecutive underscores');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const recoveryPinSchema = z
  .string()
  .length(4, 'Recovery PIN must be exactly 4 digits')
  .regex(/^\d{4}$/, 'Recovery PIN must be exactly 4 digits');

export const diaryContentSchema = z
  .string()
  .min(1, 'Content cannot be empty')
  .max(5000, 'Content must be at most 5000 characters');

export const tagsSchema = z
  .array(z.string().min(1).max(30))
  .max(10, 'Maximum 10 tags allowed');

export const moodSchema = z
  .string()
  .min(1)
  .max(50);

export const fontSchema = z
  .enum(['Caveat', 'Crimson Text', 'Indie Flower', 'Shadows Into Light', 'Kalam', 'Patrick Hand']);

export const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format');

export const commentSchema = z
  .string()
  .min(1, 'Comment cannot be empty')
  .max(1000, 'Comment must be at most 1000 characters');

// Sanitize HTML to prevent XSS
export function escapeHtml(text: string): string {
  const div = { toString: () => '' } as any;
  if (typeof document !== 'undefined') {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate and sanitize inputs
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }
  return { success: true, data: result.data };
}
