import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, MapPin, Mic, Camera, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const EmergencyDashboard: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'reporting' | 'dispatched'>('idle');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [triageData, setTriageData] = useState<any>(null);
  
  // Multimodal Inputs
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Location error", err)
    );
  }, []);

  const getApiUrl = () => {
    return import.meta.env.DEV ? 'http://localhost:3001' : (import.meta.env.VITE_API_URL || '');
  };

  const uploadToGCS = async (file: File): Promise<string> => {
    const apiUrl = getApiUrl();
    const fileName = `${Date.now()}-${file.name}`;
    
    // 1. Get Signed URL
    const { data } = await axios.post(`${apiUrl}/api/upload-url`, {
      fileName,
      contentType: file.type
    });

    // 2. Upload file directly to GCS
    await axios.put(data.uploadUrl, file, {
      headers: { 'Content-Type': file.type }
    });

    return data.gcsUri;
  };

  const handlePanic = async () => {
    setStatus('reporting');
    try {
      const apiUrl = getApiUrl();
      const payload: any = { location: location };

      // Decide strategy based on inputs
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
      console.error(error);
      alert("System failure. Re-routing to standard 911.");
      setStatus('idle');
    }
  };

  return (
    <div className="dashboard-container">
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%' }}
          >
            <Shield size={64} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
            <h1 className="brand-title">AEGIS SYSTEM</h1>
            
            <div className="glass-card">
              <div className="section-title">
                <FileText size={18} /> Provide Details (Optional)
              </div>
              <textarea 
                className="premium-textarea"
                placeholder="What exactly is happening?"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              
              <div className="upload-group">
                <label className={`upload-btn ${selectedFile?.type.startsWith('image') ? 'active' : ''}`}>
                  <Camera size={28} />
                  {selectedFile?.type.startsWith('image') ? 'Image Attached' : 'Capture Photo'}
                  <input type="file" accept="image/*" className="hidden-input" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </label>
                <label className={`upload-btn ${selectedFile?.type.startsWith('audio') ? 'active' : ''}`}>
                  <Mic size={28} />
                  {selectedFile?.type.startsWith('audio') ? 'Audio Attached' : 'Record Audio'}
                  <input type="file" accept="audio/*,video/mp4" className="hidden-input" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <button className="panic-btn" onClick={handlePanic}>
              <AlertTriangle size={40} />
              INITIATE SOS
            </button>
            
            <p className="stat-text" style={{ justifyContent: 'center' }}>
              <MapPin size={16} color="var(--accent-gold)" /> 
              {location ? "GPS Locked & Transmitting" : "Acquiring Target Signal..."}
            </p>
          </motion.div>
        )}

        {status === 'reporting' && (
          <motion.div 
            key="reporting"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div className="spinner"></div>
            <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)', margin: 0 }}>INGESTING CHAOS...</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Processing Request via Vertex AI Intelligence</p>
          </motion.div>
        )}

        {status === 'dispatched' && (
          <motion.div 
            key="dispatched"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            style={{ width: '100%' }}
          >
            <CheckCircle2 size={80} color="var(--accent-green)" style={{ margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent-green)', margin: 0 }}>DISPATCHED</h2>
            <p style={{ fontSize: '2rem', fontWeight: 600, margin: '1rem 0' }}>ETA: {eta}</p>
            
            {triageData && (
              <div className="triage-report">
                <div className="triage-item">
                  <span className="triage-label">Analyzed Incident</span>
                  <strong>{triageData.incidentType}</strong>
                </div>
                <div className="triage-item">
                  <span className="triage-label">Assessed Severity (1-5)</span>
                  <strong style={{ color: triageData.severity >= 4 ? 'var(--accent-red)' : 'var(--accent-gold)' }}>
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
            >
              Clear System
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmergencyDashboard;
