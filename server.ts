import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const aiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (aiApiKey) {
  ai = new GoogleGenAI({
    apiKey: aiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// In-memory data store for simulated state
let webhookPayloads: Array<{
  webhookId: string;
  receivedAt: string;
  method: string;
  body: any;
  headers: any;
  query: any;
}> = [];

let mockDatabase: Array<any> = [
  { id: "lead_12", name: "Sarah Connor", email: "sarah@cyberdyne.io", value: 12500, region: "NA" },
  { id: "lead_13", name: "Miles Dyson", email: "mdyson@cyberdyne.io", value: 3500, region: "EU" },
  { id: "lead_14", name: "John Connor", email: "john@resistance.net", value: 75000, region: "APAC" }
];

// 1. Webhook endpoint that workflows can configure
app.all("/api/webhooks/:webhookId", (req, res) => {
  const { webhookId } = req.params;
  const payload = {
    webhookId,
    receivedAt: new Date().toISOString(),
    method: req.method,
    body: req.body || {},
    headers: req.headers || {},
    query: req.query || {},
  };

  webhookPayloads.push(payload);
  
  // Keep memory bounded to last 100 webhooks
  if (webhookPayloads.length > 100) {
    webhookPayloads.shift();
  }

  console.log(`[Webhook] Success! Received payload for endpoint webhookId: ${webhookId}`);
  res.json({
    status: "success",
    message: "Webhook received by n8n Workflow Studio",
    webhookId,
    processedAt: payload.receivedAt
  });
});

// 2. Poll newly arrived webhook payloads
app.get("/api/webhooks/poll/:webhookId?", (req, res) => {
  const { webhookId } = req.params;
  const since = req.query.since as string;

  let filtered = webhookPayloads;
  if (webhookId) {
    filtered = filtered.filter(p => p.webhookId === webhookId);
  }
  if (since) {
    filtered = filtered.filter(p => p.receivedAt > since);
  }

  res.json(filtered);
});

// 3. Simple Mock Database endpoints for nodes
app.get("/api/mock-db", (req, res) => {
  res.json(mockDatabase);
});

app.post("/api/mock-db", (req, res) => {
  const newRow = {
    id: `lead_${Math.random().toString(36).substr(2, 5)}`,
    ...req.body
  };
  mockDatabase.push(newRow);
  res.json({ status: "success", data: newRow });
});

// 4. Server-Side secure Gemini node execution
app.post("/api/execute-ai", async (req, res) => {
  const { prompt, systemInstruction, model } = req.body;

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API client not initialized. Please ensure your GEMINI_API_KEY secret is configured."
    });
  }

  const modelToUse = model || "gemini-3.5-flash";

  try {
    const options: any = {
      model: modelToUse,
      contents: prompt,
    };

    if (systemInstruction) {
      options.config = {
        systemInstruction,
      };
    }

    const response = await ai.models.generateContent(options);
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini AI API Call Failed:", error);
    res.status(500).json({
      error: error.message || "An error occurred with the Gemini API. Please check your system logs."
    });
  }
});

// 5. Secure CORS-bypassing proxy for HTTP actions
app.post("/api/proxy", async (req, res) => {
  const { url, method, headers, body } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing Target URL" });
  }

  try {
    const formattedHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (Array.isArray(headers)) {
      headers.forEach(h => {
        if (h.key && h.value) {
          formattedHeaders[h.key] = h.value;
        }
      });
    }

    const fetchOptions: any = {
      method: method || "GET",
      headers: formattedHeaders,
    };

    if (body && (method === "POST" || method === "PUT" || method === "DELETE")) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    console.log(`[Proxy] Requesting external resource: ${method} -> ${url}`);
    const targetResponse = await fetch(url, fetchOptions);
    const contentType = targetResponse.headers.get("content-type") || "";

    let bodyData: any;
    if (contentType.includes("application/json")) {
      bodyData = await targetResponse.json();
    } else {
      bodyData = await targetResponse.text();
    }

    res.json({
      status: targetResponse.status,
      statusText: targetResponse.statusText,
      data: bodyData,
    });
  } catch (error: any) {
    console.error("CORS Proxy Failed for target URL:", url, error);
    res.status(500).json({
      error: `Proxy request failed: ${error.message}`
    });
  }
});

// Setup Vite Dev Server / production serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`n8n Workflow Studio Dev server listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
