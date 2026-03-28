import { PIIScrubber } from "../src/infrastructure/security/PIIScrubber";
import { DispatchOrchestratorFacade } from "../src/application/DispatchOrchestratorFacade";
import { TextProcessor } from "../src/infrastructure/processors/TextProcessor";
import { AudioProcessor } from "../src/infrastructure/processors/AudioProcessor";
import { ImageProcessor } from "../src/infrastructure/processors/ImageProcessor";
import { IGeminiService } from "../src/infrastructure/services/GeminiService";
import { ProcessedData } from "../src/domain/IEmergencyInputProcessor";

// Mock Gemini Service to avoid Vertex AI calls during unit tests
class MockGeminiService implements IGeminiService {
  async triage(content: string, mediaUri?: string): Promise<ProcessedData> {
    return {
      incidentType: content.includes("crash") ? "Traffic Accident" : "Medical Emergency",
      severity: content.includes("hit") ? 5 : 3,
      locationContext: content,
      medicalResponse: ["Ambulance", "Fire Personnel"],
      rawTranscription: content
    };
  }
}

describe("Aegis Core Verification", () => {
  test("PII Scrubber should redact emails and phones", () => {
    const raw = "Call me at 555-555-0199 or email test@example.com";
    const scrubbed = PIIScrubber.scrub(raw);
    expect(scrubbed).toContain("[REDACTED PHONE]");
    expect(scrubbed).toContain("[REDACTED EMAIL]");
  });

  test("Orchestrator should route text to dispatch", async () => {
    const processors = {
      text: new TextProcessor(),
      audio: new AudioProcessor(),
      image: new ImageProcessor()
    };
    const gemini = new MockGeminiService();
    const orchestrator = new DispatchOrchestratorFacade(processors, gemini);

    // Using real data simulation
    const result = await orchestrator.handle({ text: "Major car crash on 5th" });
    expect(result.status).toBe("DISPATCHED");
    expect(result.triage.incidentType).toBe("Traffic Accident");
  });
});
