import { apiFetch } from "./api";

// Utility to check email system status from server
interface EmailConfig {
  isConfigured: boolean;
  hasVerifiedDomain: boolean;
  isProductionReady: boolean;
  isDevelopment: boolean;
  status: string;
}

let emailConfig: EmailConfig | null = null;
let configLoadAttempted = false;

async function loadEmailConfig(): Promise<EmailConfig> {
  if (emailConfig) return emailConfig;
  if (configLoadAttempted) return emailConfig || getDefaultEmailConfig();

  configLoadAttempted = true;

  try {
    const response = await apiFetch("/config/email");
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    emailConfig = await response.json();
    console.log("✅ Loaded email configuration from server");
    return emailConfig;
  } catch (error) {
    console.warn("⚠️ Failed to load email configuration from server:", error);

    // Server not available - use default configuration
    console.log("❌ Email server not available");
    emailConfig = getDefaultEmailConfig();
    return emailConfig;
  }
}

function getDefaultEmailConfig(): EmailConfig {
  return {
    isConfigured: false,
    hasVerifiedDomain: false,
    isProductionReady: false,
    isDevelopment: true,
    status: "Email service not configured - server unavailable",
  };
}

// Get email status from server
export async function getEmailStatus(): Promise<EmailConfig> {
  return await loadEmailConfig();
}

// Helper to check email status (for internal use only)
export async function checkEmailStatus(): Promise<EmailConfig> {
  return await getEmailStatus();
}
