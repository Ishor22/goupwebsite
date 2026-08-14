import { z } from 'zod';

// Only http/https are ever allowed for a pasted link -- javascript:, data:,
// and every other scheme are rejected, since these values can end up in
// <img src>, <video src>, <iframe src>, or <a href> across the site.
function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

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
    .refine((value) => isHttpUrl(value), 'Enter a valid image URL')
    .optional()
    .or(z.literal('')),
});

// A picture is either a plain http(s) link the brother pasted in, or a
// data: URI our own upload endpoint produced (see lib/productImage.ts) --
// never anything else, so a data:text/html or similar can't sneak in even
// though the only place this value is ever used is <img src>.
const DATA_IMAGE_URI = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

// Generous enough for the 1.5MB picture upload limit once base64-encoded,
// with headroom to spare -- pasted links are always far shorter than this.
const productImageValue = z
  .string()
  .trim()
  .max(3_000_000, 'Image is too large')
  .refine((value) => DATA_IMAGE_URI.test(value) || isHttpUrl(value), 'Enter a valid image URL')
  .optional()
  .or(z.literal(''));

// A video is always a plain http(s) link -- either pasted by the brother
// (YouTube, a direct file link, etc.) or the Vercel Blob URL our own video
// upload endpoint returned. Unlike pictures, videos are never embedded as
// a data: URI (that would mean multi-megabyte videos in every page load),
// so no data: exception is needed here.
const productVideoValue = z
  .string()
  .trim()
  .max(2000, 'Enter a valid video URL')
  .refine((value) => isHttpUrl(value), 'Enter a valid http or https video URL')
  .optional()
  .or(z.literal(''));

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(150, 'Product name is too long'),
  price: z
    .number({ invalid_type_error: 'Enter a valid price' })
    .positive('Price must be greater than 0')
    .max(1000000, 'Price is too large'),
  description: z.string().trim().max(2000, 'Description is too long').optional().or(z.literal('')),
  imageUrl: productImageValue,
  videoUrl: productVideoValue,
});
