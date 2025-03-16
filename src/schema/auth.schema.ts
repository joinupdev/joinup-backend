import { z } from 'zod';

export const emailSchema = z.string().email().min(1).max(255);

export const passwordSchema = z.string().min(6).max(255);

export const verificationCodeSchema = z.string().min(1).max(255);

export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  verificationCode: verificationCodeSchema
})