import { IEmergencyInputProcessor, ProcessedData } from "../../domain/IEmergencyInputProcessor.js";

export class ImageProcessor implements IEmergencyInputProcessor {
  async process(payload: { imageUri: string }): Promise<ProcessedData> {
    return {
      incidentType: "Pending Triage",
      severity: 0,
      locationContext: "",
      medicalResponse: [],
      rawTranscription: payload.imageUri // Act as media reference
    };
  }
}
