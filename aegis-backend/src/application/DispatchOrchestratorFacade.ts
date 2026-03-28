import { IEmergencyInputProcessor } from "../domain/IEmergencyInputProcessor.js";
import { IGeminiService } from "../infrastructure/services/GeminiService.js";
import { IMapsService } from "../infrastructure/services/MapsService.js";

export class DispatchOrchestratorFacade {
  constructor(
    private processors: Record<string, IEmergencyInputProcessor>,
    private geminiService: IGeminiService,
    private mapsService: IMapsService
  ) {}

  async handle(payload: any) {
    let textToProcess = "";
    let mediaUri: string | undefined = undefined;

    // 1. Strategy Routing based on Payload Profile
    if (payload.imageUri) {
      const processor = this.processors['image'];
      const result = await processor.process(payload);
      textToProcess = "";
      mediaUri = result.rawTranscription; // Contains the GCS URI
    } else if (payload.audioUri) {
      const processor = this.processors['audio'];
      const result = await processor.process(payload);
      textToProcess = "";
      mediaUri = result.rawTranscription;
    } else {
      const processor = this.processors['text'];
      const result = await processor.process(payload);
      textToProcess = result.rawTranscription || "";
    }

    // 2. Multimodal Intelligence Layer (Triage via Vertex AI)
    const triage = await this.geminiService.triage(textToProcess, mediaUri);

    // 3. Action Loop (Google Maps ETA Generation)
    const routeEta = await this.mapsService.calculateETA(payload.location || null, triage.locationContext);

    return {
      status: "dispatched",
      eta: routeEta,
      triage: triage,
      timestamp: new Date().toISOString()
    };
  }
}
