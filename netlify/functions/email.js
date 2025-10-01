import { isValidEmail, normalizeEmail } from "./email-validation.js";

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
    };
  }

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Email service not configured - missing RESEND_API_KEY",
        }),
      };
    }

    // Use the new verified domain for CorkCount
    const fromEmail = process.env.VITE_FROM_EMAIL || "orders@corkcount.app";
    const verifiedDomain = "corkcount.app";

    // Validate that we're using the correct verified domain
    if (!fromEmail.includes(verifiedDomain)) {
      console.warn(
        `Email from address ${fromEmail} does not use verified domain ${verifiedDomain}`,
      );
    }

    const filEmail = process.env.VITE_FIL_EMAIL;
    const testEmail = process.env.VITE_TEST_EMAIL;
    const hasVerifiedDomain = fromEmail.includes(verifiedDomain);

    // Improved production detection - prioritize explicit production setting
    // 1. If NODE_ENV is explicitly set to production (highest priority)
    // 2. If we have a verified domain (not resend.dev)
    // 3. If explicitly not development (fallback)
    const isExplicitProduction = process.env.NODE_ENV === "production";
    const isProductionReady =
      isExplicitProduction ||
      hasVerifiedDomain ||
      (!testEmail && process.env.NODE_ENV !== "development");
    const isDevelopment = !isProductionReady && !isExplicitProduction;

    console.log(
      `Email mode detection: NODE_ENV=${process.env.NODE_ENV}, hasVerifiedDomain=${hasVerifiedDomain}, hasTestEmail=${!!testEmail}, isProductionReady=${isProductionReady}, isDevelopment=${isDevelopment}`,
    );

    const defaultFrom = `KB Winery <${fromEmail}>`;
    const body = event.body ? JSON.parse(event.body) : {};
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "No messages provided",
        }),
      };
    }

    // Using enhanced email validation from shared utility

    // Process messages and handle development mode
    const emailsToSend = [];
    const skippedEmails = [];

    for (const msg of messages) {
      const recipients = Array.isArray(msg.to) ? msg.to : [msg.to];

      // Filter out invalid email addresses
      const validRecipients = recipients.filter((email) => {
        const isValid = isValidEmail(email);
        if (!isValid) {
          console.warn(`Skipping invalid email address: ${email}`);
          skippedEmails.push({ email, reason: "Invalid email format" });
        }
        return isValid;
      });

      // Skip if no valid recipients
      if (validRecipients.length === 0) {
        console.warn("No valid recipients found for message, skipping");
        continue;
      }

      // In development mode, redirect emails to test address
      const finalRecipients =
        isDevelopment && testEmail && isValidEmail(testEmail)
          ? [testEmail]
          : validRecipients;

      // Adjust subject and content for development mode
      const finalSubject = isDevelopment
        ? `[TEST] ${msg.subject} (for ${validRecipients.join(", ")})`
        : msg.subject;

      const finalHtml = isDevelopment
        ? `<p><strong>TEST EMAIL - Original recipients: ${validRecipients.join(", ")}</strong></p>${msg.html}`
        : msg.html;

      emailsToSend.push({
        from: msg.from || defaultFrom,
        to: finalRecipients,
        subject: finalSubject,
        html: finalHtml,
      });

      // ALWAYS send to admin for order confirmations if admin email is configured and valid
      if (msg.type === "order_confirmation" && filEmail && msg.orderData) {
        // Validate admin email
        const adminEmailToUse =
          isDevelopment && testEmail && isValidEmail(testEmail)
            ? testEmail
            : filEmail;

        if (isValidEmail(adminEmailToUse)) {
          const adminSubject = isDevelopment
            ? `[TEST] New Order - ${msg.orderData.orderNumber} (for ${filEmail})`
            : `New Order Received - ${msg.orderData.orderNumber}`;

          // Create admin-specific email content
          const adminHtml = isDevelopment
            ? `<p><strong>TEST EMAIL - Original recipient: ${filEmail}</strong></p>
               <div style="background: #f0f8ff; padding: 15px; margin: 10px 0; border-left: 4px solid #0066cc;">
                 <h4 style="margin: 0; color: #0066cc;">Admin Notification</h4>
                 <p style="margin: 5px 0 0 0;">This is a copy of the customer order confirmation.</p>
               </div>
               ${msg.html}`
            : `<div style="background: #f0f8ff; padding: 15px; margin: 10px 0; border-left: 4px solid #0066cc;">
                 <h4 style="margin: 0; color: #0066cc;">Admin Notification</h4>
                 <p style="margin: 5px 0 0 0;">This is a copy of the customer order confirmation for order ${msg.orderData.orderNumber}.</p>
               </div>
               ${msg.html}`;

          console.log(
            `Adding admin email: ${adminEmailToUse} (dev mode: ${isDevelopment}, production: ${isProductionReady})`,
          );

          emailsToSend.push({
            from: msg.from || defaultFrom,
            to: [adminEmailToUse],
            subject: adminSubject,
            html: adminHtml,
            type: "admin_notification",
          });
        } else {
          console.warn(
            `Invalid admin email address: ${adminEmailToUse}, skipping admin notification`,
          );
          skippedEmails.push({
            email: adminEmailToUse,
            reason: "Invalid admin email format",
          });
        }
      }
    }

    // Log email processing summary
    console.log(
      `Processed ${messages.length} message(s), prepared ${emailsToSend.length} email(s) for sending`,
    );
    if (skippedEmails.length > 0) {
      console.warn(
        `Skipped ${skippedEmails.length} invalid email(s):`,
        skippedEmails,
      );
    }

    // If no valid emails to send, return early
    if (emailsToSend.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "No valid email addresses found",
          skipped: skippedEmails,
        }),
      };
    }

    // Production mode - no VITE_TEST_EMAIL dependency
    if (isProductionReady) {
      console.log(
        "Running in production mode with verified domain - sending emails directly to recipients",
      );
    } else if (isDevelopment) {
      console.log(
        "Running in development mode - emails may be redirected based on configuration",
      );
    }

    const sendOne = async (msg) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: msg.from || defaultFrom,
          to: msg.to,
          subject: msg.subject,
          html: msg.html,
          reply_to: `support@${verifiedDomain}`,
          // Add headers to improve deliverability with verified domain
          headers: {
            "X-Entity-Ref-ID": `corkcount-${Date.now()}`,
            "List-Unsubscribe": `<mailto:unsubscribe@${verifiedDomain}>`,
            "X-Priority": "3",
            "X-Mailer": "CorkCount Order System",
            "Return-Path": fromEmail,
            Sender: fromEmail,
          },
          // Add tags for tracking (only ASCII letters, numbers, underscores, dashes)
          tags: [
            {
              name: "category",
              value: msg.type || "order_confirmation",
            },
            {
              name: "source",
              value: "corkcount_app",
            },
            {
              name: "domain",
              value: "corkcount_app",
            },
          ],
        }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Email API error: ${response.status} ${text}`.trim());
      }
      return response.json();
    };

    const results = await Promise.allSettled(emailsToSend.map(sendOne));
    const failures = results
      .map((r, i) => ({ r, i, email: emailsToSend[i] }))
      .filter((x) => x.r.status === "rejected")
      .map((x) => ({
        index: x.i,
        recipient: Array.isArray(x.email.to) ? x.email.to[0] : x.email.to,
        type: x.email.type || "customer",
        reason: x.r.reason?.message || String(x.r.reason) || "Unknown error",
      }));

    const successes = results.filter((r) => r.status === "fulfilled").length;
    const customerEmails = emailsToSend.filter(
      (e) => !e.type || e.type === "order_confirmation",
    ).length;
    const adminEmails = emailsToSend.filter(
      (e) => e.type === "admin_notification",
    ).length;
    const customerSuccess = results
      .slice(0, customerEmails)
      .every((r) => r.status === "fulfilled");
    const adminSuccess =
      adminEmails === 0 ||
      results.slice(customerEmails).every((r) => r.status === "fulfilled");

    console.log(
      `Email results: ${successes}/${results.length} sent successfully. Customer: ${customerSuccess}, Admin: ${adminSuccess}`,
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: failures.length === 0,
        failures,
        total: results.length,
        sent: successes,
        customerSuccess,
        adminSuccess,
        customerEmailCount: customerEmails,
        adminEmailCount: adminEmails,
        skipped: skippedEmails,
        domain: verifiedDomain,
        fromAddress: fromEmail,
      }),
    };
  } catch (error) {
    console.error("Email error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      }),
    };
  }
};
