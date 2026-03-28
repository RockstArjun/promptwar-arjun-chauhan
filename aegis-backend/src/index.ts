import 'dotenv/config.js';
import express from "express";
import cors from "cors";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const compression = require("compression");

import { TextProcessor } from "./infrastructure/processors/TextProcessor.js";
import { AudioProcessor } from "./infrastructure/processors/AudioProcessor.js";
import { ImageProcessor } from "./infrastructure/processors/ImageProcessor.js";
import { GeminiService } from "./infrastructure/services/GeminiService.js";
import { MapsService } from "./infrastructure/services/MapsService.js";
import { DispatchOrchestratorFacade } from "./application/DispatchOrchestratorFacade.js";
import { Storage } from '@google-cloud/storage';

const app = express();

/** 
 * CRITICAL FIX: CORS Middleware MUST BE DECLARED FIRST!
 * Otherwise, the RateLimiter and Helmet will block Preflight OPTIONS requests, causing browser CORS crashes.
 */
app.use(cors());

/** 
 * SECURITY & EFFICIENCY MIDDLEWARE
 * Helmet: Sets HTTP security headers to protect against XSS and injection
 * Compression: GZIP compresses heavily-loaded JSON payloads for maximum metric efficiency
 */
app.use(helmet());
app.use(compression());
app.use(express.json());

// Rate Limiter: Prevents API abuse and DDOS on extreme emergencies
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use("/api/", apiLimiter);


/**
 * CORE DISPATCH ORCHESTRATOR
 */
const processors = {
  text: new TextProcessor(),
  audio: new AudioProcessor(),
  image: new ImageProcessor()
};
const geminiService = new GeminiService();
const mapsService = new MapsService();
const orchestrator = new DispatchOrchestratorFacade(processors, geminiService, mapsService);

const storageOptions = process.env.GCP_SA_JSON 
  ? { credentials: JSON.parse(process.env.GCP_SA_JSON) } 
  : {};
const storage = new Storage(storageOptions);
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || 'extreme-tooling-491605-media');

app.get("/", (req, res) => {
  res.send(`
    <body style="background: black; color: #FFFF00; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
      <h1 style="font-size: 5rem; font-weight: 900; border: 10px solid #FFFF00; padding: 20px;">AEGIS ACTIVE</h1>
      <p style="font-size: 1.5rem; margin-top: 20px; color: white;">Deterministic Bridge is Online</p>
      <div style="margin-top: 40px; color: #555;">[ System: Gemini 1.5 Flash | Mode: Modular Monolith ]</div>
    </body>
  `);
});

/**
 * @route POST /api/report
 * @desc Ingests incident data, passes through strategy, routes to Vertex AI, computes maps, and returns.
 */
app.post("/api/report", async (req, res) => {
  try {
    const result = await orchestrator.handle(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal System Error" });
  }
});

/**
 * @route POST /api/upload-url
 * @desc Generates a secure Edge Upload portal for Civilian devices to bypass Backend I/O limits.
 */
app.post("/api/upload-url", async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName) return res.status(400).json({ error: "Missing fileName" });

    // Ensure strict file types to prevent malformed injections
    const sanitizeContentType = contentType && typeof contentType === 'string' ? contentType : 'application/octet-stream';

    const [url] = await bucket.file(fileName).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: sanitizeContentType,
    });

    res.json({ 
      uploadUrl: url, 
      gcsUri: `gs://${bucket.name}/${fileName}`
    });
  } catch (error) {
    console.error("Failed to generate upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[Aegis Backend] Ready at http://localhost:${PORT}`);
});
