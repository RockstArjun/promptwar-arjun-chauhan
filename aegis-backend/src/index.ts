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
