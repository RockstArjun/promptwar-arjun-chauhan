import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, MapPin, Mic, Camera, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Strict Typings
interface LocationData {
  lat: number;
  lng: number;
}

interface TriageResponse {
  incidentType: string;
  severity: number;
  locationContext: string;
  medicalResponse: string[];
}

const EmergencyDashboard: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'reporting' | 'dispatched'>('idle');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [triageData, setTriageData] = useState<TriageResponse | null>(null);
  
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Location access denied.", err)
      );
    }
  }, []);

  const getApiUrl = useCallback(() => {
    return import.meta.env.DEV 
      ? 'http://localhost:3001' 
      : (import.meta.env.VITE_API_URL || 'https://aegis-backend-1020240605059.europe-west1.run.app');
  }, []);

  const uploadToGCS = useCallback(async (file: File): Promise<string> => {
    const apiUrl = getApiUrl();
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    const { data } = await axios.post(`${apiUrl}/api/upload-url`, {
      fileName,
      contentType: file.type
    });

    await axios.put(data.uploadUrl, file, {
      headers: { 'Content-Type': file.type }
    });

    return data.gcsUri;
  }, [getApiUrl]);

  const handlePanic = useCallback(async () => {
    setStatus('reporting');
    try {
      const apiUrl = getApiUrl();
      const payload: Record<string, unknown> = { location: location };

      if (selectedFile) {
        const gcsUri = await uploadToGCS(selectedFile);
        if (selectedFile.type.startsWith('image/')) {
           payload.imageUri = gcsUri;
        } else if (selectedFile.type.startsWith('audio/') || selectedFile.type.startsWith('video/')) {
           payload.audioUri = gcsUri;
        }
      } else if (textInput.trim() !== "") {
        payload.text = textInput;
      } else {
        payload.text = "Emergency declared with no context. Dispatch immediate assistance.";
      }

      const response = await axios.post(`${apiUrl}/api/report`, payload);
      setEta(response.data.eta);
      setTriageData(response.data.triage);
      setStatus('dispatched');
    } catch (error) {
      console.error("Emergency Dispatch Failed:", error);
      alert("System failure. Re-routing to standard emergency switchboard.");
      setStatus('idle');
    }
  }, [getApiUrl, uploadToGCS, location, selectedFile, textInput]);

  return (
    <main className="dashboard-container" role="main" aria-label="Emergency Dispatch Dashboard">
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.section 
            key="idle"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%' }}
            aria-live="polite"
          >
            <header>
              <Shield size={64} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} aria-hidden="true" />
              <h1 className="brand-title">AEGIS SYSTEM</h1>
            </header>
            
            <section className="glass-card" aria-labelledby="details-heading">
              <label id="details-heading" htmlFor="emergency-text" className="section-title">
                <FileText size={18} aria-hidden="true" /> Provide Details (Optional)
              </label>
              <textarea 
                id="emergency-text"
                className="premium-textarea"
                placeholder="What exactly is happening?"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                aria-label="Describe the emergency here. You can also upload a photo or audio clip."
                tabIndex={0}
              />
              
              <div className="upload-group" role="group" aria-label="Media Attachments">
                <label className={`upload-btn ${selectedFile?.type.startsWith('image') ? 'active' : ''}`} tabIndex={0} role="button">
                  <Camera size={28} aria-hidden="true" />
                  {selectedFile?.type.startsWith('image') ? 'Image Attached' : 'Capture Photo'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden-input" 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                    aria-label="Upload an image"
                    tabIndex={-1}
                  />
                </label>
                <label className={`upload-btn ${selectedFile?.type.startsWith('audio') ? 'active' : ''}`} tabIndex={0} role="button">
                  <Mic size={28} aria-hidden="true" />
                  {selectedFile?.type.startsWith('audio') ? 'Audio Attached' : 'Record Audio'}
                  <input 
                    type="file" 
                    accept="audio/*,video/mp4" 
                    className="hidden-input" 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                    aria-label="Upload an audio or video clip"
                    tabIndex={-1}
                  />
                </label>
              </div>
            </section>

            <button 
              className="panic-btn" 
              onClick={handlePanic}
              aria-label="Initiate SOS Request. Double tap if using screen reader."
              title="Initiate Emergency Dispatch"
              tabIndex={0}
            >
              <AlertTriangle size={40} aria-hidden="true" />
              INITIATE SOS
            </button>
            
            <p className="stat-text" style={{ justifyContent: 'center' }} aria-live="polite">
              <MapPin size={16} color="var(--accent-gold)" aria-hidden="true" /> 
              {location ? "GPS Locked & Transmitting" : "Acquiring Target Signal..."}
            </p>
          </motion.section>
        )}

        {status === 'reporting' && (
          <motion.div 
            key="reporting"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            role="status"
            aria-live="assertive"
          >
            <div className="spinner" aria-hidden="true"></div>
            <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)', margin: 0 }}>INGESTING INCIDENT...</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Processing Request securely via Vertex AI Intelligence</p>
          </motion.div>
        )}

        {status === 'dispatched' && (
          <motion.section 
            key="dispatched"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            style={{ width: '100%' }}
            role="alert"
            aria-labelledby="dispatched-heading"
          >
            <CheckCircle2 size={80} color="var(--accent-green)" style={{ margin: '0 auto 1.5rem' }} aria-hidden="true" />
            <h2 id="dispatched-heading" style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent-green)', margin: 0 }}>DISPATCHED</h2>
            <p style={{ fontSize: '2rem', fontWeight: 600, margin: '1rem 0' }} aria-label={`Estimated time of arrival is ${eta}`}>ETA: {eta}</p>
            
            {triageData && (
              <div className="triage-report" role="region" aria-label="Triage Assessment Report">
                <div className="triage-item">
                  <span className="triage-label">Analyzed Incident</span>
                  <strong>{triageData.incidentType}</strong>
                </div>
                <div className="triage-item">
                  <span className="triage-label" id="severity-label">Assessed Severity (1-5)</span>
                  <strong 
                    style={{ color: triageData.severity >= 4 ? 'var(--accent-red)' : 'var(--accent-gold)' }}
                    aria-labelledby="severity-label"
                  >
                    Level {triageData.severity}
                  </strong>
                </div>
                <div className="triage-item">
                  <span className="triage-label">Deployed Units</span>
                  <strong>{triageData.medicalResponse.join(" • ")}</strong>
                </div>
              </div>
            )}

            <button 
              className="btn-secondary"
              onClick={() => { setStatus('idle'); setTextInput(""); setSelectedFile(null); }}
              aria-label="Clear System and Return to Dashboard"
              tabIndex={0}
            >
              Clear System
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
};

export default EmergencyDashboard;
