import { IEmergencyInputProcessor, ProcessedData } from "../domain/IEmergencyInputProcessor.js";
import { IGeminiService } from "../infrastructure/services/GeminiService.js";
import { PIIScrubber } from "../infrastructure/security/PIIScrubber.js";

export class DispatchOrchestratorFacade {
  constructor(
    private readonly processors: Record<string, IEmergencyInputProcessor>,
    private readonly geminiService: IGeminiService
  ) {}

  public async handle(payload: any): Promise<any> {
    console.log("[Aegis] Ingesting Human Chaos...");
    
    let type = "text";
    if (payload.audioUri) type = "audio";
    else if (payload.imageUri) type = "image";

    const processor = this.processors[type];
    if (!processor) {
        throw new Error(`Unsupported input type: ${type}`);
    }

    // 1. Process Raw Input (Strategy Pattern)
    const initialData = await processor.process(payload);
    
    // 2. Security (Double check PII Scrubbing)
    const contentToTriage = type === 'text' 
      ? PIIScrubber.scrub(initialData.rawTranscription || "") 
      : initialData.rawTranscription || "";
    
    // 3. Intelligence (Gemini Triage)
    let triageResult;
    if (type === 'text') {
        triageResult = await this.geminiService.triage(contentToTriage);
    } else {
        triageResult = await this.geminiService.triage("Analyze this emergency media", contentToTriage);
    }
    
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
