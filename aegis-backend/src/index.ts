import express from "express";
import cors from "cors";
import { TextProcessor } from "./infrastructure/processors/TextProcessor";
import { GeminiService } from "./infrastructure/services/GeminiService";
import { DispatchOrchestratorFacade } from "./application/DispatchOrchestratorFacade";

const app = express();
app.use(cors());
app.use(express.json());

// Dependency Injection (Manual for Hackathon speed)
const textProcessor = new TextProcessor();
const geminiService = new GeminiService();
const orchestrator = new DispatchOrchestratorFacade(textProcessor, geminiService);

app.get("/", (req, res) => {
  res.send(`
    <body style="background: black; color: #FFFF00; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
      <h1 style="font-size: 5rem; font-weight: 900; border: 10px solid #FFFF00; padding: 20px;">AEGIS ACTIVE</h1>
      <p style="font-size: 1.5rem; margin-top: 20px; color: white;">Deterministic Bridge is Online</p>
      <div style="margin-top: 40px; color: #555;">[ System: Gemini 1.5 Flash | Mode: Modular Monolith ]</div>
    </body>
  `);
});

app.post("/api/report", async (req, res) => {
  try {
    const result = await orchestrator.handle(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal System Error" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[Aegis Backend] Ready at http://localhost:${PORT}`);
});
