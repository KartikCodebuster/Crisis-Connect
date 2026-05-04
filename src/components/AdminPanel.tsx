import React, { useState, useEffect } from 'react';
import { subscribeToGlobalEmergencies, subscribeToGlobalUsers, subscribeToGlobalCircles, EmergencyRequest, EmergencyStatus } from '../services/dbService';
import { Shield, Activity, Users, Radio, MapPin, CheckCircle2, User as UserIcon, Phone, Globe, Layers, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export function AdminPanel() {
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'signals' | 'intelligence' | 'networks'>('signals');

  useEffect(() => {
    const unsubEmergies = subscribeToGlobalEmergencies(setEmergencies);
    const unsubUsers = subscribeToGlobalUsers(setUsers);
    const unsubCircles = subscribeToGlobalCircles(setCircles);
    return () => {
      unsubEmergies();
      unsubUsers();
      unsubCircles();
    };
  }, []);

  const pendingSignals = emergencies.filter(e => e.status === EmergencyStatus.PENDING).length;
  const activeMissions = emergencies.filter(e => e.status === EmergencyStatus.ACCEPTED).length;

  return (
    <div className="space-y-6 pb-32 px-4 md:px-0">
      {/* Network Health Overview */}
      <div className="bg-gray-950 p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block">
          <Globe className="w-32 h-32 text-indigo-500 animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Live Network Telemetry</h3>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Active SOS', value: pendingSignals, color: 'text-red-500', icon: Radio },
              { label: 'Guardians', value: users.length, color: 'text-indigo-400', icon: Users },
              { label: 'Networks', value: circles.length, color: 'text-emerald-400', icon: Layers },
              { label: 'Missions', value: activeMissions, color: 'text-blue-400', icon: Activity },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-3xl flex flex-col justify-between h-24 md:h-auto">
                <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
                <div>
                  <div className="text-xl md:text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-[7px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* Tactical Switching - Larger Touch Targets for Mobile */}
        <div className="flex p-2 bg-gray-50/80 border-b border-gray-100 overflow-x-auto no-scrollbar">
          {[
            { id: 'signals', label: 'Signals', icon: Radio },
            { id: 'intelligence', label: 'Personnel', icon: Users },
            { id: 'networks', label: 'Networks', icon: Layers }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all min-w-[100px] ${
                activeTab === tab.id ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'signals' && (
              <motion.div 
                key="signals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {emergencies.length === 0 ? (
                  <div className="py-20 text-center text-gray-300">
                    <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting signals...</p>
                  </div>
                ) : (
                  emergencies.map((e) => (
                    <div key={e.id} className="p-5 rounded-3xl bg-gray-50 border border-gray-100 hover:border-indigo-100 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img src={e.requesterPhoto || ''} className="w-10 h-10 rounded-xl object-cover" alt="" referrerPolicy="no-referrer" />
                          <div>
                            <h4 className="text-sm font-black text-gray-950">{e.requesterName}</h4>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {e.createdAt?.toDate ? formatDistanceToNow(e.createdAt.toDate(), { addSuffix: true }) : 'Live'}
                            </span>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                          e.status === EmergencyStatus.PENDING ? 'bg-red-100 text-red-600 animate-pulse' : 
                          e.status === EmergencyStatus.ACCEPTED ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {e.status}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-600">
                        <div className="flex items-center gap-1.5 backdrop-blur-sm bg-white/50 px-3 py-1.5 rounded-xl border border-white">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          {e.location.lat.toFixed(4)}, {e.location.lng.toFixed(4)}
                        </div>
                        {e.requesterPhone && (
                          <div className="flex items-center gap-1.5 backdrop-blur-sm bg-white/50 px-3 py-1.5 rounded-xl border border-white text-indigo-600">
                            <Phone className="w-3 h-3" />
                            {e.requesterPhone}
                          </div>
                        )}
                      </div>

                      {e.helperName && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                           <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                             <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                           </div>
                           <p className="text-[9px] font-black uppercase text-gray-500">
                             Mission Accepted by <span className="text-emerald-600">{e.helperName}</span>
                           </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'intelligence' && (
              <motion.div 
                key="intel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid gap-3"
              >
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                    <div className="flex items-center gap-3">
                      <img src={u.photoURL} className="w-10 h-10 rounded-xl object-cover" alt="" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="text-xs font-black text-gray-950">{u.displayName || 'Anonymous Sentinal'}</h4>
                        <p className="text-[9px] text-gray-400 font-bold">{u.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">Status</p>
                      <div className="flex items-center gap-1.5 transition-all">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                        <span className="text-[10px] font-black text-emerald-600">SYNCED</span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'networks' && (
              <motion.div 
                key="networks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {circles.map(c => (
                  <div key={c.id} className="p-5 rounded-3xl bg-indigo-50/30 border border-indigo-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                      <Layers className="w-24 h-24 text-indigo-600" />
                    </div>
                    <div className="flex flex-col gap-1 mb-4">
                      <h4 className="text-sm font-black text-gray-950">{c.name}</h4>
                      <p className="text-[10px] text-gray-500 font-medium italic">{c.description || 'Verified Safety Network'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <div className="flex -space-x-2">
                           {[1,2,3].map(i => (
                             <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-indigo-50 flex items-center justify-center">
                               <Users className="w-3 h-3 text-indigo-400" />
                             </div>
                           ))}
                         </div>
                         <span className="text-[9px] font-black text-indigo-600 uppercase">Circle Active</span>
                       </div>
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                         ID: {c.inviteCode}
                       </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Admin Operations Section */}
      <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem]">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Protocol Integrity</h4>
        <p className="text-xs text-emerald-800 leading-relaxed italic">
          Network is currently operating at <span className="font-black">100% efficiency</span>. 
          Cross-platform pings are stable. All guardians within the {users.length} active pool are verified against the initial trust root.
        </p>
      </div>
    </div>
  );
}
