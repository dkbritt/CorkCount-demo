// Centralized validation utilities using Zod for standard email validation
import { z } from "zod";

// Standard email validation schema using Zod's built-in .email() method
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email address is required")
  .max(254, "Email address is too long")
  .email("Please enter a valid email address");

// Helper function to validate a single email address
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || "Invalid email",
      };
    }
    return { isValid: false, error: "Invalid email format" };
  }
}

// Helper function to normalize email (trim and lowercase)
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Checkout form validation schema
export const checkoutFormSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required"),
  email: emailSchema,
  phone: z.string().optional(),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTime: z.string().min(1, "Pickup time is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  orderNotes: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

// Validate checkout form data
export function validateCheckoutForm(data: any): {
  isValid: boolean;
  errors: Partial<Record<keyof CheckoutFormData, string>>;
  data?: CheckoutFormData;
} {
  try {
    const validData = checkoutFormSchema.parse(data);
    return { isValid: true, errors: {}, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Partial<Record<keyof CheckoutFormData, string>> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          const field = err.path[0] as keyof CheckoutFormData;
          errors[field] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { customerName: "Validation error" } };
  }
}
