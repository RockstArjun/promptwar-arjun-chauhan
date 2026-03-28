import { VertexAI } from '@google-cloud/vertexai';
import { ProcessedData } from "../../domain/IEmergencyInputProcessor.js";

export interface IGeminiService {
  triage(content: string, mediaUri?: string): Promise<ProcessedData>;
}

export class GeminiService implements IGeminiService {
  private vertexAI: VertexAI;
  private model: any;

  constructor() {
    // VertexAI requires custom credentials to be wrapped in googleAuthOptions
    const saJson = process.env.GCP_SA_JSON ? JSON.parse(process.env.GCP_SA_JSON) : null;
    const authOptions = saJson ? { googleAuthOptions: { credentials: saJson } } : {};

    const projectId = process.env.GOOGLE_PROJECT_ID || (saJson ? saJson.project_id : 'extreme-tooling-491605');

    // Force us-central1 for Gemini Flash, as some local regions (like asia-south2) do not support the generative AI APIs, throwing a 501.
    this.vertexAI = new VertexAI({ 
      project: projectId, 
      location: process.env.VERTEX_LOCATION || 'us-central1',
      ...authOptions
    });
    
    this.model = this.vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash-002',
      systemInstruction: `You are an Emergency Dispatch Triage AI. 
      Analyze the input and output ONLY a valid JSON object matching this schema exactly:
      {
        "incidentType": "string",
        "severity": 1-5,
        "locationContext": "string",
        "medicalResponse": ["Ambulance", "Fire", "Police"],
        "rawTranscription": "string"
      }`
    });
  }

  async triage(content: string, mediaUri?: string): Promise<ProcessedData> {
    try {
      const parts: any[] = [];
      if (content && content.trim().length > 0) {
        parts.push({ text: content });
      } else {
        parts.push({ text: "Empty text provided. Analyze the attached media if any." });
      }

      if (mediaUri) {
        let mimeType = 'image/jpeg';
        if (mediaUri.includes('.mp4')) mimeType = 'video/mp4';
        else if (mediaUri.includes('.wav') || mediaUri.includes('.mp3')) mimeType = 'audio/mpeg';

        parts.push({
          fileData: {
            mimeType: mimeType,
            fileUri: mediaUri
          }
        });
      }

      const request = {
        contents: [{ role: 'user', parts }],
      };

      const result = await this.model.generateContent(request);
      const response = await result.response;
      let text = response.candidates[0].content.parts[0].text;
      
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(text) as ProcessedData;
    } catch (error) {
      console.error("[GeminiService Error] Failed to triage:", error);
      return {
        incidentType: "Unknown Emergency",
        severity: 5,
        locationContext: "Unknown",
        medicalResponse: ["Ambulance", "Police"],
        rawTranscription: content
      };
    }
  }
}
