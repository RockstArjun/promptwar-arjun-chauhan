import { PIIScrubber } from "../src/infrastructure/security/PIIScrubber";
import { DispatchOrchestratorFacade } from "../src/application/DispatchOrchestratorFacade";
import { TextProcessor } from "../src/infrastructure/processors/TextProcessor";
import { GeminiService } from "../src/infrastructure/services/GeminiService";

describe("Aegis Core Verification", () => {
  test("PII Scrubber should redact emails and phones", () => {
    const raw = "Call me at 555-0199 or email test@example.com";
    const scrubbed = PIIScrubber.scrub(raw);
    expect(scrubbed).toContain("[REDACTED PHONE]");
    expect(scrubbed).toContain("[REDACTED EMAIL]");
  });

  test("Orchestrator should route text to dispatch", async () => {
    const processor = new TextProcessor();
    const gemini = new GeminiService();
    const orchestrator = new DispatchOrchestratorFacade(processor, gemini);

    const result = await orchestrator.handle({ text: "Major car crash on 5th" });
    expect(result.status).toBe("DISPATCHED");
    expect(result.triage.incidentType).toBe("Traffic Accident");
  });
});
