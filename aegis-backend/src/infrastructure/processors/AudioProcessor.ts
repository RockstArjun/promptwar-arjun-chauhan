import { IEmergencyInputProcessor, ProcessedData } from "../../domain/IEmergencyInputProcessor.js";

export class AudioProcessor implements IEmergencyInputProcessor {
  async process(payload: { audioUri: string }): Promise<ProcessedData> {
    return {
      incidentType: "Pending Triage",
      severity: 0,
      locationContext: "",
      medicalResponse: [],
      rawTranscription: payload.audioUri // Act as the media reference
    };
  }
}
