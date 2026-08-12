import { z } from 'zod';

export const brotherNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name is too long');

export const setupSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const brotherRegistrationSchema = z
  .object({
    brotherId: z.string().min(1, 'Select your name from the list'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    code: z.string().trim().min(1, 'Enter your registration code'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const brotherLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const brotherProfileSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  bio: z.string().trim().max(500, 'Bio is too long').optional().or(z.literal('')),
  photoUrl: z
    .string()
    .trim()
    .max(500)
    .url('Enter a valid image URL')
    .optional()
    .or(z.literal('')),
});

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .url('Enter a valid URL')
  .optional()
  .or(z.literal(''));

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(150, 'Product name is too long'),
  price: z
    .number({ invalid_type_error: 'Enter a valid price' })
    .positive('Price must be greater than 0')
    .max(1000000, 'Price is too large'),
  description: z.string().trim().max(2000, 'Description is too long').optional().or(z.literal('')),
  imageUrl: optionalUrl,
  videoUrl: optionalUrl,
});
