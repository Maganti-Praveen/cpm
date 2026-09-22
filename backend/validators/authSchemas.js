import { z } from "zod";

const passwordComplexity = z.string()
  .min(8, "Password must be at least 8 characters long")
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((val) => /[a-z]/.test(val), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Password must contain at least one number",
  })
  .refine((val) => /[^A-Za-z0-9]/.test(val), {
    message: "Password must contain at least one special character",
  });

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(1, "Password is required"),
    role: z.enum(["ADMIN", "STAFF", "CLIENT"]).optional(),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address").toLowerCase(),
    password: passwordComplexity.optional().or(z.literal("")),
    role: z.enum(["ADMIN", "STAFF", "CLIENT"]).optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    status: z.string().optional(),
    adminRole: z.string().optional(),
    permissions: z.any().optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    code: z.string().length(6, "Verification code must be exactly 6 digits"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    password: passwordComplexity,
    confirmPassword: passwordComplexity,
  }),
});
