import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, LogIn, Zap, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1920" 
          alt="Tactical Background"
          className="w-full h-full object-cover opacity-20 grayscale scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="flex flex-col items-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="bg-indigo-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-600/40 relative group"
          >
            <ShieldAlert className="text-white w-12 h-12" />
            <motion.div 
              animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-indigo-600 rounded-[2.5rem] -z-10"
            />
          </motion.div>
          
          <h1 className="text-5xl font-black text-white mb-4 font-display tracking-tight text-center">
            Safety<span className="text-indigo-500">Assist</span>
          </h1>
          <p className="text-gray-400 text-center leading-relaxed font-medium">
            Tactical Crisis Response & Community Protection Network.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={login}
            className="w-full bg-white text-black flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all active:scale-[0.98] shadow-xl group"
          >
            <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            Initialize Identity
          </button>
          
          <div className="grid grid-cols-2 gap-3 mt-8">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 backdrop-blur-md">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Response Speed</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 backdrop-blur-md">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Verified Hub</span>
            </div>
          </div>
        </div>

        <p className="mt-12 text-[10px] text-gray-600 text-center uppercase tracking-widest font-mono font-bold">
          Safety Assist Protocol v2.4.0
        </p>
      </motion.div>
      
      <p className="absolute bottom-8 left-0 right-0 px-8 text-center text-[10px] text-gray-500 max-w-xs mx-auto leading-relaxed uppercase tracking-tighter">
        Deployment Secured via End-to-End Encryption & Biometric Trust Layers.
      </p>
    </div>
  );
}
