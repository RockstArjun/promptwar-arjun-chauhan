import { IEmergencyInputProcessor, ProcessedData } from "../../domain/IEmergencyInputProcessor";
import { PIIScrubber } from "../security/PIIScrubber";

export class TextProcessor implements IEmergencyInputProcessor {
  async process(payload: { text: string }): Promise<ProcessedData> {
    const sanitizedText = PIIScrubber.scrub(payload.text);
    
    // In a real implementation, this would call Gemini. 
    // For now, we return a structured mock that Gemini would produce.
    return {
      incidentType: "Pending Triage",
      severity: 0,
      locationContext: sanitizedText,
      medicalResponse: [],
      rawTranscription: sanitizedText
    };
  }
}
