import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const EmergencyDashboard: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'reporting' | 'dispatched'>('idle');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Location error", err)
    );
  }, []);

  const handlePanic = async () => {
    setStatus('reporting');
    try {
      // Small delay to simulate "ingesting chaos"
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      setTimeout(async () => {
        const response = await axios.post(`${apiUrl}/api/report`, {
          text: "VOICE REPORT: Panic at current location",
          location: location
        });
        setEta(response.data.eta);
        setStatus('dispatched');
      }, 1500);
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  return (
    <div className="dashboard">
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <Shield className="text-yellow-400 w-16 h-16 mb-8" />
            <h1 className="text-4xl font-black mb-12">AEGIS SYSTEM</h1>
            <button 
              className="panic-button flex items-center justify-center gap-4"
              onClick={handlePanic}
            >
              <AlertTriangle size={48} />
              REPORT
            </button>
            <p className="text-gray-400 mt-8 flex items-center gap-2">
              <MapPin size={18} /> {location ? "GPS Active" : "Waiting for GPS..."}
            </p>
          </motion.div>
        )}

        {status === 'reporting' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 border-8 border-yellow-400 border-t-transparent rounded-full animate-spin mb-8"></div>
            <h2 className="text-3xl font-bold text-yellow-400">INGESTING CHAOS...</h2>
            <p className="text-gray-400 mt-4">Gemini 1.5 Flash Triage in progress</p>
          </motion.div>
        )}

        {status === 'dispatched' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="bg-green-600 p-8 rounded-full mb-8">
              <Shield className="text-white w-20 h-20" />
            </div>
            <h2 className="text-5xl font-black text-green-500 mb-4">DISPATCHED</h2>
            <p className="text-3xl font-bold">ETA: {eta}</p>
            <button 
              className="mt-12 text-gray-400 underline"
              onClick={() => setStatus('idle')}
            >
              Back to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmergencyDashboard;
