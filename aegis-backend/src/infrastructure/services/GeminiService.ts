import { ProcessedData } from "../../domain/IEmergencyInputProcessor";

export interface IGeminiService {
  triage(content: string, mediaUri?: string): Promise<ProcessedData>;
}

export class GeminiService implements IGeminiService {
  async triage(content: string, mediaUri?: string): Promise<ProcessedData> {
    // This will eventually call Vertex AI Gemini 1.5 Flash
    // For now, we return a mock based on the input context
    return {
      incidentType: content.includes("crash") ? "Traffic Accident" : "Medical Emergency",
      severity: content.includes("hit") ? 5 : 3,
      locationContext: content,
      medicalResponse: ["Ambulance", "Fire Personnel"],
      rawTranscription: content
    };
  }
}
