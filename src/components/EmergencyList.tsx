import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmergencyRequest, subscribeToNearbyEmergencies, acceptEmergency, EmergencyStatus, subscribeToMyAssignments, subscribeToMyCircles } from '../services/dbService';
import { useLocation } from '../hooks/useLocation';
import { calculateDistance, formatDistance } from '../lib/utils';
import { MapPin, User, ArrowRight, Shield, AlertCircle, Clock, Navigation, Map as MapIcon, List, MessageSquare, X, UserCheck, ShieldAlert, Phone } from 'lucide-react';

import { EmergencyMap } from './EmergencyMap';
import { Chat } from './Chat';
import { useAuth } from '../hooks/useAuth';

export function EmergencyList() {
  const { latitude, longitude } = useLocation();
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [myAssignments, setMyAssignments] = useState<EmergencyRequest[]>([]);
  const [myCircleIds, setMyCircleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to memberships to know which circles the user belongs to
    const unsubscribeCircles = subscribeToMyCircles((circles) => {
      setMyCircleIds(circles.map(c => c.id));
    });

    return () => unsubscribeCircles();
  }, [user]);

  useEffect(() => {
    if (!latitude || !longitude) return;

    setLoading(true);
    const unsubscribeNearby = subscribeToNearbyEmergencies(latitude, longitude, 5000, (data) => {
      setEmergencies(data);
      setLoading(false);
    });

    const unsubscribeAssignments = subscribeToMyAssignments((data) => {
      setMyAssignments(data);
    });

    return () => {
      unsubscribeNearby();
      unsubscribeAssignments();
    };
  }, [latitude, longitude]);

  if (!latitude || !longitude) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="relative">
          <motion.div 
            animate={{ scale: [1, 1.4], opacity: [0.2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-indigo-500 rounded-full"
          />
          <div className="relative bg-indigo-600 p-5 rounded-3xl shadow-xl shadow-indigo-600/20">
            <MapPin className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 px-8">
          <h3 className="text-xl font-black text-gray-950 font-display">Updating Location</h3>
          <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs">
            We are identifying the closest responders and community members in your area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {myAssignments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-950 font-display tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            Your Missions
          </h2>
          <div className="space-y-4">
            {myAssignments.map((assignment, index) => (
              <EmergencyCard 
                key={assignment.id} 
                emergency={assignment} 
                userLat={latitude} 
                userLng={longitude} 
                index={index}
                isAssignment
              />
            ))}
          </div>
          <div className="h-px bg-gray-100 my-8" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-gray-950 font-display tracking-tight">Community Alerts</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Active Radius: 5km
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'map' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
          >
            <MapIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {viewMode === 'map' ? (
          <EmergencyMap 
            center={{ lat: latitude, lng: longitude }} 
            emergencies={emergencies} 
            onAccept={acceptEmergency}
            myCircleIds={myCircleIds}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {loading ? (
               <div className="space-y-4">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="h-40 bg-white rounded-[2rem] border border-gray-100 animate-pulse" />
                 ))}
               </div>
            ) : emergencies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-gray-100 flex flex-col items-center gap-8 group"
            >
              <div className="relative">
                 <motion.div 
                   animate={{ 
                     rotate: 360,
                     scale: [1, 1.1, 1]
                   }}
                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 bg-blue-50 rounded-full scale-150 blur-2xl opacity-50" 
                 />
                 <div className="relative bg-gray-50 p-8 rounded-full group-hover:bg-blue-50 transition-colors">
                    <Shield className="w-12 h-12 text-gray-200 group-hover:text-blue-200 transition-colors" />
                 </div>
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-black text-gray-950 font-display tracking-tight text-center">Peaceful Perimeter</p>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-loose text-center">
                  No distress signals detected in your community<br/>within the 5km coverage zone.
                </p>
              </div>
            </motion.div>
          ) : (
            emergencies.map((emergency, index) => {
              const isCircleMember = emergency.circleIds?.some(id => myCircleIds.includes(id));
              return (
                <EmergencyCard 
                  key={emergency.id} 
                  emergency={emergency} 
                  userLat={latitude} 
                  userLng={longitude} 
                  index={index}
                  isFromMyCircle={isCircleMember}
                />
              );
            })
          )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface EmergencyCardProps {
  key?: React.Key;
  emergency: EmergencyRequest;
  userLat: number;
  userLng: number;
  index: number;
  isAssignment?: boolean;
  isFromMyCircle?: boolean;
}

const EmergencyCard = React.memo(({ emergency, userLat, userLng, index, isAssignment = false, isFromMyCircle = false }: EmergencyCardProps) => {
  const distance = calculateDistance(userLat, userLng, emergency.location.lat, emergency.location.lng);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();

  const handleAccept = async () => {
    setIsAccepting(true);
    await acceptEmergency(emergency.id);
    setIsAccepting(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] } 
      }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`
        group relative overflow-hidden bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-7 transition-all duration-700
        ${emergency.status === EmergencyStatus.ACCEPTED ? 'border border-blue-200 bg-blue-50/10 shadow-sm' : isFromMyCircle ? 'border-4 border-red-600 bg-red-50/20 shadow-[0_32px_64px_-16px_rgba(220,38,38,0.25)] ring-8 ring-red-600/5' : 'border border-gray-100 shadow-sm hover:shadow-2xl'}
      `}
    >
      {isFromMyCircle && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600 animate-pulse z-20" />
      )}
      
      <div className={`absolute -top-12 -right-12 w-48 h-48 blur-[100px] opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none duration-1000 ${emergency.status === EmergencyStatus.ACCEPTED ? 'bg-blue-600' : isFromMyCircle ? 'bg-red-900 opacity-60' : 'bg-red-600'}`} />

      <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8">
        <div className="relative flex-none">
          {emergency.requesterPhoto ? (
            <img 
              src={emergency.requesterPhoto} 
              alt="" 
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] border-2 shadow-xl object-cover ${isFromMyCircle ? 'border-red-500 ring-4 ring-red-500/20' : 'border-white'}`} 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] bg-red-50 flex items-center justify-center border-2 shadow-xl ${isFromMyCircle ? 'border-red-500' : 'border-white'}`}>
              <AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-red-500" />
            </div>
          )}
          <motion.div 
            animate={{ scale: isFromMyCircle ? [1, 1.4, 1] : [1, 1.2, 1] }}
            transition={{ duration: isFromMyCircle ? 1 : 2, repeat: Infinity }}
            className={`absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 border-2 border-white rounded-full flex items-center justify-center shadow-lg ${emergency.status === EmergencyStatus.ACCEPTED ? 'bg-blue-500' : isFromMyCircle ? 'bg-red-600' : 'bg-green-500'}`}
          >
             {emergency.status === EmergencyStatus.ACCEPTED ? <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" /> : isFromMyCircle ? <ShieldAlert className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" /> : <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full" />}
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-0.5 md:mb-1">
            <h3 className="font-black text-gray-950 font-display text-lg md:text-xl tracking-tight truncate">
              {emergency.requesterName}
            </h3>
            {(emergency.circleId || isFromMyCircle) && (
              <div className="flex items-center gap-1.5 bg-gray-950 px-2 py-1 rounded-xl shadow-lg border border-white/10 shrink-0">
                <ShieldAlert className="w-2.5 h-2.5 text-red-500 fill-current" />
                <span className="text-[7px] md:text-[8px] font-black text-white uppercase tracking-[0.2em]">Guardian Alert</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
             <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-0.5 md:py-1 rounded-lg">
                <Navigation className="w-2.5 h-2.5 text-gray-400 rotate-45" />
                <span className="text-[9px] md:text-[10px] font-black text-gray-900 font-mono italic">
                  {formatDistance(distance)} AWAY
                </span>
             </div>
             {(emergency.circleId || isFromMyCircle) ? (
               <div className="flex items-center gap-1.5 bg-red-100 px-2 py-0.5 md:py-1 rounded-lg">
                 <Shield className="w-2.5 h-2.5 text-red-600" />
                 <span className="text-[8px] md:text-[9px] font-black text-red-600 uppercase tracking-widest font-mono">CRITICAL</span>
               </div>
             ) : (
               <div className="flex items-center gap-1.5">
                 <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-300" />
                 <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest font-mono">PRIORITY 1</span>
               </div>
             )}
          </div>
        </div>

      </div>

      <div className="bg-gray-50/50 rounded-[1.5rem] md:rounded-3xl p-5 md:p-6 mb-6 md:mb-8 border border-gray-100 shadow-inner group-hover:bg-white transition-colors duration-500">
        <p className="text-gray-700 font-semibold italic leading-relaxed text-sm md:text-base">
          &ldquo;{emergency.description}&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 md:gap-4">
        {emergency.status === EmergencyStatus.PENDING ? (
          <>
            <div className="hidden lg:flex items-center gap-2 text-gray-400 font-black text-[9px] uppercase tracking-[0.2em] pl-2">
              <Shield className="w-4 h-4" />
              Community Response Active
            </div>
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="flex-1 bg-gray-950 text-white px-6 md:px-8 py-4.5 md:py-5 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-black/10 disabled:opacity-50 group/btn"
            >
              {isAccepting ? 'ESTABLISHING...' : (
                <>
                  Engage Protocol
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform duration-300" />
                </>
              )}
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between bg-blue-600 text-white p-4 md:p-5 rounded-2xl shadow-2xl shadow-blue-600/30 overflow-hidden relative text-left">
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] animate-[shimmer_2s_infinite] pointer-events-none" />
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${emergency.location.lat},${emergency.location.lng}&travelmode=walking`, '_blank')}
                  className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors active:scale-95"
                  title="Navigation"
                >
                  <Navigation className="w-5 h-5" />
                </button>
                {emergency.requesterPhone && (
                  <button 
                    onClick={() => window.open(`tel:${emergency.requesterPhone}`, '_self')}
                    className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors active:scale-95"
                    title="Call Requester"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                )}
                <div className="text-left">
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-70 leading-none mb-1.5 italic">Secured by Responder</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black font-display tracking-tight truncate max-w-[120px]">{emergency.helperName}</p>
                  </div>
                </div>
              </div>
            <div className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest font-mono shrink-0">
              EN ROUTE
            </div>
          </div>
        )}
      </div>

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
            <Chat emergencyId={emergency.id} recipientName={emergency.requesterName} />
          </div>
        </motion.div>
      )}

      {emergency.status === EmergencyStatus.ACCEPTED && emergency.helperId === user?.uid && (
        <button 
          onClick={() => setShowChat(true)}
          className="absolute top-4 right-4 bg-blue-50 p-2 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}
    </motion.div>
  );
});
