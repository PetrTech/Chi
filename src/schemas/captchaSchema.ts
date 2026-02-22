import { z } from 'zod';

export const verifySchema = z.object({
  nonce: z.number().int().min(0),
  
  salt: z.string().min(16).max(64),
  challenge: z.string().min(32).max(192),
  
  signature: z.string().length(64),
  
  expiresAt: z.number().positive(),
});

export type VerifyInput = z.infer<typeof verifySchema>;