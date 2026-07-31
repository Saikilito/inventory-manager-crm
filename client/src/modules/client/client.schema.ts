import { z } from 'zod';

export const clientFormSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Must be at least 2 characters')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, 'Must contain only letters'),
  lastName: z
    .string()
    .min(2, 'Must be at least 2 characters')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, 'Must contain only letters'),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  whatsapp: z.string().regex(/^\+?[0-9\s-]{10,15}$/, 'Valid phone required (e.g. +1234567890)'),
  nationalId: z
    .string()
    .min(5, 'ID must be at least 5 chars')
    .regex(/^[a-zA-Z0-9-]+$/, 'Invalid characters (use V-12345678)'),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;
