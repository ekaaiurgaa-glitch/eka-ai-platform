import { z } from 'zod';

/**
 * Job Card Form Validation Schema
 * 
 * Uses Zod for type-safe form validation with React Hook Form
 */

// Phone number validation for Indian format
const phoneRegex = /^\+91[6-9]\d{9}$/;

// Vehicle registration validation (Indian format)
const registrationRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;

export const jobCardSchema = z.object({
  registration_number: z
    .string()
    .min(1, "Registration number is required")
    .regex(registrationRegex, "Invalid format (e.g., MH01AB1234)"),
  
  customer_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  
  customer_phone: z
    .string()
    .regex(phoneRegex, "Invalid Indian phone format (+91XXXXXXXXXX)"),
  
  customer_email: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal('')),
  
  odometer_reading: z
    .number()
    .min(0, "Odometer cannot be negative")
    .max(1000000, "Odometer reading seems unrealistic")
    .optional(),
  
  fuel_level: z
    .enum(['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTER', 'FULL'])
    .optional(),
  
  priority: z
    .enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'])
    .default('NORMAL'),
  
  symptoms: z
    .array(z.string().min(1))
    .min(1, "At least one symptom is required"),
  
  reported_issues: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  
  notes: z
    .string()
    .max(2000, "Notes must be less than 2000 characters")
    .optional(),
});

export type JobCardFormValues = z.infer<typeof jobCardSchema>;

/**
 * PDI Checklist Item Schema
 */
export const pdiItemSchema = z.object({
  id: z.string(),
  completed: z.boolean(),
  notes: z.string().max(500).optional(),
  has_evidence: z.boolean().default(false),
});

export type PDIItemFormValues = z.infer<typeof pdiItemSchema>;

/**
 * PDI Completion Schema
 */
export const pdiCompletionSchema = z.object({
  technician_declaration: z.boolean().refine(val => val === true, {
    message: "You must declare that all items have been checked",
  }),
  declaration_text: z
    .string()
    .min(10, "Declaration must be at least 10 characters")
    .max(500, "Declaration must be less than 500 characters"),
});

export type PDICompletionFormValues = z.infer<typeof pdiCompletionSchema>;

/**
 * Invoice Item Schema
 */
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  hsn_code: z.string().optional(),
  type: z.enum(['PART', 'LABOR', 'SERVICE']),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Price cannot be negative"),
  discount_percent: z.number().min(0).max(100).optional(),
  gst_rate: z.number().min(0).max(28).optional(),
});

export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;

/**
 * Complete Invoice Schema
 */
export const invoiceSchema = z.object({
  customer_gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z0-9]$/, "Invalid GSTIN format")
    .optional()
    .or(z.literal('')),
  
  billing_address: z.string().max(500).optional(),
  
  items: z
    .array(invoiceItemSchema)
    .min(1, "At least one item is required"),
  
  discount_amount: z.number().min(0).optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

/**
 * Login Form Schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
