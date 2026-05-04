import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile, getUserProfile } from '../services/dbService';
import { User, Phone, CheckCircle2, Loader2, Save, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export function Profile() {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      // Fetch extended profile for phone number
      const fetchProfile = async () => {
        const profile = await getUserProfile(user.uid);
        if (profile?.phoneNumber) {
          setPhoneNumber(profile.phoneNumber);
        }
        setIsLoading(false);
      };
      fetchProfile();
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await updateUserProfile({ phoneNumber, displayName });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 blur-3xl -z-10 rounded-full" />
        
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-950 font-display tracking-tight leading-none mb-2">Member Identity</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Secure your responder profile</p>
          </div>
          <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-100">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col items-center gap-4 mb-4">
             <div className="relative group">
               {user?.photoURL ? (
                 <img 
                   src={user.photoURL} 
                   alt={displayName} 
                   className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-2xl object-cover transition-transform group-hover:scale-105"
                   referrerPolicy="no-referrer"
                 />
               ) : (
                 <div className="w-24 h-24 rounded-[2rem] bg-gray-50 border-4 border-white shadow-2xl flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-200" />
                 </div>
               )}
               <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg border-4 border-white">
                 <CheckCircle2 className="w-4 h-4" />
               </div>
             </div>
             <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{user?.email}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Responder Name</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-gray-50 border border-gray-100 rounded-3xl py-4 pl-12 pr-6 text-gray-950 font-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Tactical Contact Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-gray-50 border border-gray-100 rounded-3xl py-4 pl-12 pr-6 text-gray-950 font-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                />
              </div>
              <p className="px-4 text-[9px] text-gray-400 font-medium leading-relaxed italic">
                * This number will ONLY be shared with verified responders who accept your distress signals.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              type="submit"
              disabled={isSaving}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                saveStatus === 'success' ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-indigo-600 text-white shadow-indigo-100'
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : saveStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Profile Updated
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Sync Profile
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={handleLogout}
              className="bg-white border border-gray-100 text-red-500 p-4 rounded-3xl hover:bg-red-50 transition-colors shadow-sm active:scale-95"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left">
        <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-6 px-2">Privacy Encryption</h4>
        <div className="space-y-3">
          {[
            "End-to-end identity verification",
            "Location scrubbing after resolution",
            "Zero permanent phone logging",
            "Guardian-only credential access"
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-50 transition-colors hover:bg-white">
              <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full" />
              <span className="text-xs font-bold text-gray-600">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
