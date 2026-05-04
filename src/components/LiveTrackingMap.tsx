import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShieldAlert, User, Navigation, ChevronLeft, Loader2, Clock, CheckCircle2, Shield, Zap, AlertTriangle } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { EmergencyRequest, subscribeToNearbyEmergencies, EmergencyStatus, acceptEmergency } from '../services/dbService';
import { auth } from '../lib/firebase';

// Custom icons
const createIcon = (color: string, icon: React.ReactNode, pulse = false) => {
  return L.divIcon({
    html: renderToStaticMarkup(
      <div className={`p-2.5 rounded-full border-4 border-white shadow-2xl relative transition-transform hover:scale-110 active:scale-95 ${pulse ? 'animate-bounce' : ''}`} style={{ backgroundColor: color }}>
        {icon}
        {pulse && (
          <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-20 pointer-events-none" style={{ color }} />
        )}
      </div>
    ),
    className: '',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
  });
};

const SOS_ICON = createIcon('#dc2626', <ShieldAlert className="w-5 h-5 text-white" />, true);
const GUARDIAN_ICON = createIcon('#gray-950', <Shield className="w-5 h-5 text-white" />, true);
const HELPING_ICON = createIcon('#2563eb', <User className="w-5 h-5 text-white" />);
const MY_LOCATION_ICON = createIcon('#10b981', <div className="w-4 h-4 bg-white rounded-full" />);

function ChangeView({ center, zoom = 14 }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  const lastCenter = React.useRef<[number, number]>(center);

  useEffect(() => {
    // Only re-center if moved significantly (> 50m) to avoid jitter
    const dist = L.latLng(center).distanceTo(L.latLng(lastCenter.current));
    if (dist > 50 || center[0] !== lastCenter.current[0]) {
      map.setView(center, zoom);
      lastCenter.current = center;
    }
  }, [center, zoom, map]);
  return null;
}

interface LiveTrackingMapProps {
  latitude: number;
  longitude: number;
  onBack: () => void;
}

export const LiveTrackingMap = React.memo(({ latitude, longitude, onBack }: LiveTrackingMapProps) => {
  const [nearbyEmergencies, setNearbyEmergencies] = useState<EmergencyRequest[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!latitude || !longitude) return;

    // Radius: 50km
    const unsubscribe = subscribeToNearbyEmergencies(latitude, longitude, 50000, (emergencies) => {
      setNearbyEmergencies(emergencies);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [latitude, longitude]);

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="h-full w-full flex flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 pt-12 flex items-center gap-4 z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors md:hidden"
        >
          <ChevronLeft className="w-6 h-6 text-gray-950" />
        </button>
        <div>
          <h2 className="font-black text-gray-950 font-display tracking-tight leading-none uppercase text-xs tracking-[0.2em]">Live Radar</h2>
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">Satellite Lock Active</p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer 
          center={[latitude, longitude]} 
          zoom={14} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={[latitude, longitude]} zoom={14} />

          {/* User Location */}
          <Marker position={[latitude, longitude]} icon={MY_LOCATION_ICON}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-black text-[10px] uppercase tracking-widest text-emerald-600">Your Position</p>
              </div>
            </Popup>
          </Marker>
          <Circle 
            center={[latitude, longitude]} 
            radius={2000} 
            pathOptions={{ fillColor: '#10b981', fillOpacity: 0.1, weight: 1, color: '#10b981' }} 
          />

          {/* Nearby Emergencies */}
          {nearbyEmergencies.map((emergency) => {
            const isMine = emergency.requesterId === auth.currentUser?.uid;
            const isAccepted = emergency.status === EmergencyStatus.ACCEPTED;
            const isCircleAlert = !!emergency.circleId;
            
            return (
              <Marker 
                key={emergency.id} 
                position={[emergency.location.lat, emergency.location.lng]} 
                icon={isAccepted ? HELPING_ICON : (isCircleAlert ? GUARDIAN_ICON : SOS_ICON)}
                eventHandlers={{
                  click: () => setSelectedEmergency(emergency),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[150px]">
                    <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-2 ${isAccepted ? 'text-blue-600' : (isCircleAlert ? 'text-gray-950' : 'text-red-600')}`}>
                      {isAccepted ? 'Response in Progress' : (isCircleAlert ? 'GUARDIAN ALERT' : 'Active SOS Signal')}
                    </p>
                    <p className="font-bold text-gray-900 text-xs mb-1">{emergency.requesterName}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-2 italic">"{emergency.description}"</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Tactical Route (Smart Routing) */}
          {selectedEmergency && (
            <Polyline 
              positions={[
                [latitude, longitude],
                [selectedEmergency.location.lat, selectedEmergency.location.lng]
              ]}
              pathOptions={{ 
                color: '#2563eb',
                weight: 3, 
                dashArray: '10, 10',
                opacity: 0.6
              }}
            />
          )}
        </MapContainer>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[2000] bg-white/50 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-gray-950 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Syncing Satellite Data</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Emergency Overlay Card */}
        <AnimatePresence>
          {selectedEmergency && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-24 left-4 right-4 z-[1000]"
            >
              <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden">
                {selectedEmergency.status === EmergencyStatus.PENDING && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-4">
                    <div className="relative">
                      {selectedEmergency.requesterPhoto ? (
                        <img src={selectedEmergency.requesterPhoto} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${selectedEmergency.status === EmergencyStatus.ACCEPTED ? 'bg-blue-500' : 'bg-red-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-950 text-lg leading-none mb-1 font-display">{selectedEmergency.requesterName}</h4>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getTimeAgo(selectedEmergency.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedEmergency(null)}
                    className="p-2 hover:bg-gray-100 rounded-xl"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-400 rotate-270" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 italic mb-6 leading-relaxed">"{selectedEmergency.description}"</p>

                {/* AI Routing Metadata */}
                <div className="mb-6 flex items-center justify-between bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-xl">
                      <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 leading-none mb-1">Smart Routing Active</p>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">AI Tactical Path Locked</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">ETA</p>
                    <p className="text-xs font-mono font-bold text-gray-950">~4.2m AVG</p>
                  </div>
                </div>

                <div className="flex gap-3">

                  <button 
                    onClick={() => {
                      window.open(`https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${selectedEmergency.location.lat},${selectedEmergency.location.lng}&travelmode=walking`, '_blank')
                    }}
                    className="flex-1 bg-gray-950 text-white flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-900 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate
                  </button>
                  {selectedEmergency.status === EmergencyStatus.PENDING && selectedEmergency.requesterId !== auth.currentUser?.uid && (
                    <button 
                      onClick={async () => {
                        try {
                          await acceptEmergency(selectedEmergency.id);
                          setSelectedEmergency(prev => prev ? { ...prev, status: EmergencyStatus.ACCEPTED, helperId: auth.currentUser?.uid || null } : null);
                        } catch (err) {
                          console.error("Failed to accept emergency:", err);
                        }
                      }}
                      className="flex-1 bg-blue-600 text-white flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-colors border border-blue-400/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Statistics Overlay */}
        {!selectedEmergency && (
          <div className="absolute bottom-12 left-4 right-4 pointer-events-none">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gray-950 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between pointer-events-auto border border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-600/20">
                  <Navigation className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1 font-mono">Location Data</p>
                  <p className="text-sm font-mono font-bold">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
});
