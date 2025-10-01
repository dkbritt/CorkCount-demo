import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAdminLogin } from "./routes/auth";
import {
  getAvailableInventory,
  getAllInventory,
  updateInventoryQuantities,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "./routes/inventory";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  deleteOrder,
  deleteOrderByNumber,
} from "./routes/orders";
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
} from "./routes/batches";
import { getMetricsData } from "./routes/metrics";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Configuration endpoints
  app.get("/api/config/supabase", (_req, res) => {
    // Check for both non-VITE and VITE prefixed environment variables
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key =
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    res.json({
      isConfigured: Boolean(url && key),
      isInsecureUrl: Boolean(url && String(url).startsWith("http://")),
      url: url ? url : undefined, // Only send URL if configured
      anonKey: key ? key : undefined, // Only send key if configured
    });
  });

  app.get("/api/config/email", (_req, res) => {
    const fromEmail = process.env.VITE_FROM_EMAIL;
    const hasVerifiedDomain = fromEmail && !fromEmail.includes("resend.dev");
    const isProductionReady =
      hasVerifiedDomain && process.env.NODE_ENV === "production";

    res.json({
      isConfigured: Boolean(fromEmail),
      hasVerifiedDomain,
      isProductionReady,
      isDevelopment: !isProductionReady,
      status: !fromEmail
        ? "Email not configured"
        : !isProductionReady
          ? "Development mode - emails redirected to test address"
          : "Production mode - emails sent to actual recipients",
    });
  });

  // Ping endpoint for API base resolution
  app.get("/api/ping", (_req, res) => {
    res.json({ status: "ok", message: "API is available" });
  });

  // Example API routes
  app.get("/api/demo", handleDemo);

  app.get("/api/demo", handleDemo);

  // Metrics endpoint
  app.get("/api/metrics", async (_req, res) => {
    try {
      const result = await getMetricsData();
      if (result.success) return res.json(result);
      return res.status(500).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required",
        });
      }

      const result = await handleAdminLogin(email, password);

      if (result.success) {
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  // Inventory endpoints
  app.get("/api/inventory", async (req, res) => {
    try {
      const { admin, page = "1", limit = "50", detailed = "false" } = req.query;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(
        100,
        Math.max(1, parseInt(limit as string) || 50),
      ); // Max 100 items per page
      const isDetailed = detailed === "true" || detailed === true;

      const result =
        admin === "true"
          ? await getAllInventory()
          : await getAvailableInventory(pageNum, limitNum, isDetailed);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const result = await addInventoryItem(req.body);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await updateInventoryItem(id, req.body);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await deleteInventoryItem(id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  app.put("/api/inventory/update", async (req, res) => {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          error: "Updates must be an array",
        });
      }

      const result = await updateInventoryQuantities(updates);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  // Orders endpoints
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = req.body;

      if (
        !orderData.orderNumber ||
        !orderData.customerName ||
        !orderData.email
      ) {
        return res.status(400).json({
          success: false,
          error: "Order number, customer name, and email are required",
        });
      }

      const result = await createOrder(orderData);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const result = await getOrders();

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "Status is required",
        });
      }

      const result = await updateOrderStatus(id, status, note);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await deleteOrder(id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  app.delete("/api/orders/by-number/:orderNumber", async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const result = await deleteOrderByNumber(orderNumber);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  // Batches endpoints
  app.get("/api/batches", async (_req, res) => {
    try {
      const result = await getBatches();
      if (result.success) return res.json(result);
      return res.status(500).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  app.post("/api/batches", async (req, res) => {
    try {
      const result = await createBatch(req.body);
      if (result.success) return res.json(result);
      return res.status(500).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  app.put("/api/batches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await updateBatch(id, req.body);
      if (result.success) return res.json(result);
      return res.status(500).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  app.delete("/api/batches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await deleteBatch(id);
      if (result.success) return res.json(result);
      return res.status(500).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // Email sending endpoint (server-side Resend proxy)
  app.post("/api/email", async (req, res) => {
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (!RESEND_API_KEY) {
        return res.status(500).json({
          success: false,
          error: "Email service not configured - missing RESEND_API_KEY",
        });
      }

      const fromEmail = process.env.VITE_FROM_EMAIL;
      if (!fromEmail) {
        return res.status(500).json({
          success: false,
          error: "Email service not configured - missing FROM_EMAIL",
        });
      }

      const filEmail = process.env.VITE_FIL_EMAIL;
      const testEmail = process.env.VITE_TEST_EMAIL;
      const hasVerifiedDomain = !fromEmail.includes("resend.dev");
      const isProductionReady =
        hasVerifiedDomain && process.env.NODE_ENV === "production";
      const isDevelopment = !isProductionReady;

      const defaultFrom = `KB Winery <${fromEmail}>`;
      const { messages } = req.body as {
        messages: Array<{
          type?: string;
          to: string | string[];
          subject: string;
          html: string;
          from?: string;
          orderData?: {
            orderNumber: string;
            customerEmail: string;
          };
        }>;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: "No messages provided" });
      }

      // Process messages and handle development mode
      const emailsToSend: Array<{
        to: string[];
        subject: string;
        html: string;
        from?: string;
      }> = [];

      for (const msg of messages) {
        const recipients = Array.isArray(msg.to) ? msg.to : [msg.to];

        // In development mode, redirect emails to test address
        const finalRecipients =
          isDevelopment && testEmail ? [testEmail] : recipients;

        // Adjust subject and content for development mode
        const finalSubject = isDevelopment
          ? `[TEST] ${msg.subject} (for ${recipients.join(", ")})`
          : msg.subject;

        const finalHtml = isDevelopment
          ? `<p><strong>TEST EMAIL - Original recipients: ${recipients.join(", ")}</strong></p>${msg.html}`
          : msg.html;

        emailsToSend.push({
          from: msg.from || defaultFrom,
          to: finalRecipients,
          subject: finalSubject,
          html: finalHtml,
        });

        // For order confirmations, also send to admin if configured
        if (msg.type === "order_confirmation" && filEmail && msg.orderData) {
          const adminRecipient =
            isDevelopment && testEmail ? testEmail : filEmail;
          const adminSubject = isDevelopment
            ? `[TEST] New Order - ${msg.orderData.orderNumber} (for ${filEmail})`
            : `New Order Received - ${msg.orderData.orderNumber}`;
          const adminHtml = isDevelopment
            ? `<p><strong>TEST EMAIL - Original recipient: ${filEmail}</strong></p>${msg.html}`
            : msg.html;

          emailsToSend.push({
            from: msg.from || defaultFrom,
            to: [adminRecipient],
            subject: adminSubject,
            html: adminHtml,
          });
        }
      }

      // Validate test email is configured for development mode
      if (isDevelopment && !testEmail) {
        return res.status(500).json({
          success: false,
          error: "Development mode requires VITE_TEST_EMAIL to be configured",
        });
      }

      const sendOne = async (msg: {
        to: string[];
        subject: string;
        html: string;
        from?: string;
      }) => {
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
        .map((r, i) => ({ r, i }))
        .filter((x) => x.r.status === "rejected")
        .map((x) => ({
          index: x.i,
          reason:
            (x.r as PromiseRejectedResult).reason?.message ||
            String((x.r as any).reason) ||
            "Unknown error",
        }));

      return res.status(200).json({
        success: failures.length === 0,
        failures,
        total: results.length,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : "Unknown server error",
      });
    }
  });

  return app;
}
