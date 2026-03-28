export interface ProcessedData {
  incidentType: string;
  severity: number;
  locationContext: string;
  medicalResponse: string[];
  rawTranscription?: string;
}

export interface IEmergencyInputProcessor {
  process(payload: any): Promise<ProcessedData>;
}
