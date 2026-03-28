import { IEmergencyInputProcessor, ProcessedData } from "../domain/IEmergencyInputProcessor";
import { IGeminiService } from "../infrastructure/services/GeminiService";
import { PIIScrubber } from "../infrastructure/security/PIIScrubber";

export class DispatchOrchestratorFacade {
  constructor(
    private readonly processor: IEmergencyInputProcessor,
    private readonly geminiService: IGeminiService
  ) {}

  public async handle(payload: any): Promise<any> {
    console.log("[Aegis] Ingesting Human Chaos...");
    
    // 1. Process Raw Input (Strategy Pattern)
    const initialData = await this.processor.process(payload);
    
    // 2. Security (Double check PII Scrubbing)
    const scrubbedContent = PIIScrubber.scrub(initialData.rawTranscription || "");
    
    // 3. Intelligence (Gemini Triage)
    const triageResult = await this.geminiService.triage(scrubbedContent);
    
    // 4. Action (Dispatch - Mocked for now)
    console.log(`[Aegis] Dispatching: ${triageResult.incidentType} | Severity: ${triageResult.severity}`);
    
    return {
      status: "DISPATCHED",
      eta: "4 mins",
      triage: triageResult,
      servicePayload: {
        units: triageResult.medicalResponse,
        priority: triageResult.severity >= 4 ? "HIGH" : "NORMAL"
      }
    };
  }
}
