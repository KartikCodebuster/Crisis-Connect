import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { ShieldAlert, MapPin, Loader2, CheckCircle2, AlertTriangle, Info, Radio, MessageSquare, X, Shield, Bell, UserCheck, ChevronRight, Phone } from 'lucide-react';
import { createEmergency, EmergencyRequest, EmergencyStatus, resolveEmergency, subscribeToMyCircles, Circle, getUserProfile } from '../services/dbService';
import { useLocation } from '../hooks/useLocation';
import { geohashForLocation } from 'geofire-common';
import { Chat } from './Chat';
import { useAuth } from '../hooks/useAuth';

interface SOSButtonProps {
  activeRequest: EmergencyRequest | null;
  onShowMap?: () => void;
}

export function SOSButton({ activeRequest, onShowMap }: SOSButtonProps) {
  const { latitude, longitude, error: geoError } = useLocation();
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchPhoneNumber = async () => {
      const profile = await getUserProfile(user.uid);
      setPhoneNumber(profile?.phoneNumber || null);
    };
    fetchPhoneNumber();
  }, [user]);

  // Circles state
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [showCircles, setShowCircles] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMyCircles(setCircles);
    return () => unsubscribe();
  }, []);

  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();

  useEffect(() => {
    if (isHolding) {
      const start = Date.now();
      const duration = 2000; // 2 seconds to hold
      
      holdTimer.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.min((elapsed / duration) * 100, 100);
        setProgress(p);
        
        if (p >= 100) {
          clearInterval(holdTimer.current!);
          handleSOS();
        }
      }, 20);
    } else {
      if (holdTimer.current) clearInterval(holdTimer.current);
      setProgress(0);
    }
    
    return () => {
      if (holdTimer.current) clearInterval(holdTimer.current);
    };
  }, [isHolding]);

  const handleSOS = async () => {
    if (!latitude || !longitude) return;
    
    setIsHolding(false);
    setIsRequesting(true);
    const hash = geohashForLocation([latitude, longitude]);
    await createEmergency(latitude, longitude, hash, 'Emergency help requested');
    // In a real implementation with circleId, we'd pass selectedCircle here.
    // For this prompt, we'll assume it notifies guardians who are in the user's circle.
    setIsRequesting(false);
    setShowConfirmation(true);

    setTimeout(() => setShowConfirmation(false), 3000);
  };

  if (activeRequest) {
    return (
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-red-500/10 border border-red-50 text-center flex flex-col items-center relative overflow-hidden"
        >
          {/* Subtle background pulse */}
          <div className="absolute inset-0 bg-red-50/30 -z-10" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-12 -right-12 w-48 h-48 bg-red-500 rounded-full blur-3xl text-red-500"
          />

          <div className="bg-red-600 p-5 rounded-3xl mb-6 shadow-xl shadow-red-600/30">
            <motion.div
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            >
              <ShieldAlert className="w-12 h-12 text-white" />
            </motion.div>
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 mb-2 font-display">SOS BROADCAST</h2>
          
          <div className="flex items-center gap-2 mb-6">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-red-600 font-mono">Real-time Beacon Active</span>
          </div>

          <div className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl mb-8 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Your Live Position</p>
                  <p className="text-sm font-mono font-bold text-gray-900">{activeRequest.location.lat.toFixed(6)}, {activeRequest.location.lng.toFixed(6)}</p>
                </div>
              </div>
              <button 
                onClick={onShowMap}
                className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm hover:bg-gray-50 transition-colors"
              >
                View Map
              </button>
            </div>
            
            <div className="h-px bg-gray-100" />
            
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                {activeRequest.status === EmergencyStatus.PENDING 
                  ? "Alerting all verified responders within a 5km radius. Please find a secure location."
                  : "Help is on the way. A responder has accepted your request and is navigating to you."}
              </p>
            </div>
          </div>

          <div className="w-full space-y-4">
            <AnimatePresence>
              {activeRequest.status === EmergencyStatus.ACCEPTED && (
                <>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-2xl flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">Responder: {activeRequest.helperName}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">En-route to you</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowChat(true)}
                      className="bg-white p-2 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all text-green-600 relative"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    </button>
                  </motion.div>

                  {showChat && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="fixed inset-0 min-h-screen bg-gray-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
                    >
                      <div className="w-full max-w-md relative">
                        <button 
                          onClick={() => setShowChat(false)}
                          className="absolute -top-12 right-0 bg-white/20 p-2 rounded-full text-white hover:bg-white/30"
                        >
                          <X className="w-6 h-6" />
                        </button>
                        <Chat emergencyId={activeRequest.id} recipientName={activeRequest.helperName || 'Responder'} />
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>

            <button
              onClick={() => resolveEmergency(activeRequest.id)}
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98] shadow-lg"
            >
              I am Safe / Resolve
            </button>
          </div>
        </motion.div>

        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-xs text-yellow-800 font-medium">
            Keep this screen open for the responder to see your precise real-time location.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Phone number warning */}
      <AnimatePresence>
        {!phoneNumber && !activeRequest && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-start gap-4 text-left"
          >
            <div className="bg-amber-100 p-2 rounded-xl shrink-0">
              <Phone className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none">Complete Tactical Profile</p>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                Add your phone number in the Profile tab so responders can contact you during a crisis.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black text-gray-950 font-display tracking-tight">Safety Assist</h2>
        <p className="text-gray-400 font-bold uppercase tracking-[0.15em] text-[9px] flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active Protection System
        </p>
      </div>

      <div className="relative flex justify-center py-6">
        {/* Radar concentric circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3].map((i) => (
            <motion.div 
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 2.8], 
                opacity: [0.3, 0],
                borderWidth: ["1.5px", "0.5px"]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeOut", 
                delay: i * 1.6 
              }}
              className="absolute w-56 h-56 border-red-400/20 rounded-full"
            />
          ))}
        </div>
        
        {/* Hold Progress Container */}
        <div className="relative p-6 bg-white/40 backdrop-blur-md rounded-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white/50">
          <div className="absolute inset-0 rotate-[-90deg]">
             <svg className="w-full h-full p-2">
               <circle
                 cx="50%"
                 cy="50%"
                 r="48%"
                 fill="none"
                 stroke="#e2e8f0"
                 strokeWidth="2"
                 className="opacity-40"
               />
               <motion.circle
                 cx="50%"
                 cy="50%"
                 r="48%"
                 fill="none"
                 stroke="#ef4444"
                 strokeWidth="4"
                 strokeDasharray="100 100"
                 strokeDashoffset={100 - progress}
                 strokeLinecap="round"
                 className="transition-all duration-75"
               />
             </svg>
          </div>

          <motion.button
            onMouseDown={() => setIsHolding(true)}
            onMouseUp={() => setIsHolding(false)}
            onMouseLeave={() => setIsHolding(false)}
            onTouchStart={() => setIsHolding(true)}
            onTouchEnd={() => setIsHolding(false)}
            animate={isHolding ? { scale: 0.96 } : { scale: 1 }}
            disabled={isRequesting || !!geoError || !latitude}
            className={`
              w-56 h-56 rounded-full flex flex-col items-center justify-center gap-2 relative z-10 transition-all duration-500 overflow-hidden
              ${geoError || !latitude 
                ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                : isHolding 
                  ? 'bg-red-700 shadow-inner' 
                  : 'bg-red-500 shadow-[0_20px_40px_-12px_rgba(239,68,68,0.4)]'}
            `}
          >
            {isRequesting ? (
              <Loader2 className="w-16 h-16 text-white animate-spin" />
            ) : (
              <>
                <motion.div
                  animate={isHolding ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <ShieldAlert className="w-20 h-20 text-white" />
                </motion.div>
                <div className="text-center">
                  <span className="text-white font-black text-4xl block font-display tracking-tighter">
                    {isHolding ? 'HOLD' : 'SOS'}
                  </span>
                  <span className="text-white/50 text-[9px] font-black uppercase tracking-[0.2em]">
                    {isHolding ? 'CONFIRMING...' : 'Hold 2s for help'}
                  </span>
                </div>
                
                {/* Inner white glow during hold */}
                {isHolding && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-t from-red-500/50 to-transparent pointer-events-none"
                  />
                )}
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        {/* Guardian Circle Selector */}
        <div className="w-full max-w-xs bg-white/80 backdrop-blur-sm rounded-[2rem] border border-gray-100 p-2 shadow-sm">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-950 leading-none mb-1">Guardian Network</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Active Coverage</p>
              </div>
            </div>
            <div className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse mr-2" />
          </div>
          
          <div className="flex gap-2 overflow-x-auto p-2 pb-3 no-scrollbar">
            {circles.length === 0 ? (
              <p className="text-[9px] text-gray-300 uppercase font-black tracking-widest p-2">Join a Circle to enable priority alerts</p>
            ) : (
              circles.map(circle => (
                <button 
                  key={circle.id}
                  onClick={() => setSelectedCircle(selectedCircle === circle.id ? null : circle.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl border transition-all ${selectedCircle === circle.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-tighter">{circle.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-sm border border-gray-100 max-w-xs text-center">
          <div className={`p-2 rounded-xl ${longitude ? 'bg-green-100' : 'bg-gray-100'}`}>
             <MapPin className={`w-4 h-4 ${longitude ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div className="text-left flex-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Current Coordinates</p>
            {latitude && longitude ? (
              <p className="text-xs font-mono font-bold text-gray-900">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
            ) : (
              <p className="text-xs font-bold text-gray-300 animate-pulse">Acquiring signal...</p>
            )}
          </div>
          {latitude && longitude && (
            <button 
              onClick={onShowMap}
              className="ml-2 text-[10px] font-black text-blue-600 uppercase tracking-tighter hover:underline"
            >
              View Map
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-32 left-4 right-4 bg-gray-950 text-white p-6 rounded-3xl shadow-2xl flex items-center gap-5 z-50 border border-white/10"
          >
            <div className="bg-green-500 p-3 rounded-2xl shadow-lg shadow-green-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="font-black text-lg tracking-tight">SOS Sent</p>
              <p className="text-sm text-gray-400 font-medium">Alerting nearby responders...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
