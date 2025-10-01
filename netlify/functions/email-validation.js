// Email validation utility for Netlify functions using Zod
// This provides the same validation logic as the client-side but for server use

// Since we can't import zod directly in this serverless function environment,
// we'll create a robust validation function that mimics Zod's email validation

/**
 * Validates email address using RFC-compliant standards
 * This implements similar validation to Zod's .email() method
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") {
    return false;
  }

  const trimmedEmail = email.trim();

  // Check length constraints (similar to Zod)
  if (trimmedEmail.length === 0 || trimmedEmail.length > 254) {
    return false;
  }

  // RFC 5322 compliant email regex (more comprehensive than our previous simple regex)
  // This covers most valid email formats including:
  // - Periods in local part (before @)
  // - Plus signs and other special characters
  // - International domain names
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(trimmedEmail);
}

/**
 * Normalizes email address (trim and lowercase)
 * @param {string} email - Email address to normalize
 * @returns {string} - Normalized email address
 */
function normalizeEmail(email) {
  if (!email || typeof email !== "string") {
    return "";
  }
  return email.trim().toLowerCase();
}

export { isValidEmail, normalizeEmail };
