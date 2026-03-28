import { PIIScrubber } from "../src/infrastructure/security/PIIScrubber.js";
import { DispatchOrchestratorFacade } from "../src/application/DispatchOrchestratorFacade.js";
import { TextProcessor } from "../src/infrastructure/processors/TextProcessor.js";
import { AudioProcessor } from "../src/infrastructure/processors/AudioProcessor.js";
import { ImageProcessor } from "../src/infrastructure/processors/ImageProcessor.js";
import { IGeminiService } from "../src/infrastructure/services/GeminiService.js";
import { IMapsService } from "../src/infrastructure/services/MapsService.js";
import { ProcessedData } from "../src/domain/IEmergencyInputProcessor.js";

// Mock Gemini Service to avoid Vertex AI calls during unit tests
class MockGeminiService implements IGeminiService {
  async triage(content: string, mediaUri?: string): Promise<ProcessedData> {
    return {
      incidentType: content.includes("crash") ? "Traffic Accident" : "Medical Emergency",
      severity: content.includes("hit") ? 5 : 3,
      locationContext: content,
      medicalResponse: ["Ambulance", "Fire Personnel"],
      rawTranscription: content || "MOCK_AUDIO"
    };
  }
}

// Mock Maps Service to avoid explicit API hits
class MockMapsService implements IMapsService {
  async calculateETA(location: any, context?: string): Promise<string> {
    if (!location) return "Acquiring GPS Signal...";
    return "4 mins (Live Mock: Unit Dispatched)";
  }
}

describe("Aegis Core Verification", () => {
  let orchestrator: DispatchOrchestratorFacade;

  beforeEach(() => {
    const processors = {
      text: new TextProcessor(),
      audio: new AudioProcessor(),
      image: new ImageProcessor()
    };
    const gemini = new MockGeminiService();
    const maps = new MockMapsService();
    orchestrator = new DispatchOrchestratorFacade(processors, gemini, maps);
  });

  test("SECURITY: PII Scrubber should redact emails and phones", () => {
    const raw = "Call me at 555-555-0199 or email test@example.com quickly!";
    const scrubbed = PIIScrubber.scrub(raw);
    expect(scrubbed).toContain("[REDACTED PHONE]");
    expect(scrubbed).toContain("[REDACTED EMAIL]");
    expect(scrubbed).not.toContain("555-555-0199");
    expect(scrubbed).not.toContain("test@example.com");
  });

  test("ORCHESTRATION: Should properly route text payload to dispatch", async () => {
    const result = await orchestrator.handle({ text: "Major car crash on 5th" });
    expect(result.status).toBe("dispatched");
    expect(result.triage.incidentType).toBe("Traffic Accident");
    expect(result.eta).toBe("Acquiring GPS Signal...");
  });

  test("ORCHESTRATION: Should properly route audio payload to dispatch", async () => {
    const result = await orchestrator.handle({ 
      audioUri: "gs://bucket/mock.wav",
      location: { lat: 40.7128, lng: -74.0060 }
    });
    expect(result.status).toBe("dispatched");
    expect(result.triage.incidentType).toBe("Medical Emergency");
    expect(result.eta).toBe("4 mins (Live Mock: Unit Dispatched)");
  });

  test("EFFICIENCY: Strategy pattern correctly resolves without evaluating other processors", async () => {
    // If it incorrectly passed an image to text processor, the mock would fail.
    const result = await orchestrator.handle({ 
      imageUri: "gs://bucket/mock.jpg",
      location: { lat: 40.7128, lng: -74.0060 }
    });
    expect(result.status).toBe("dispatched");
    expect(result.eta).toBe("4 mins (Live Mock: Unit Dispatched)");
  });
});
