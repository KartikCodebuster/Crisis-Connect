import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100 px-6 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="bg-red-600 p-2.5 rounded-2xl shadow-xl shadow-red-200"
          >
            <ShieldAlert className="text-white w-6 h-6" />
          </motion.div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter text-gray-950 font-display">
              CRISIS<span className="text-red-600 italic">CONNECT</span>
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1, 2, 3].map(i => (
                  <motion.span 
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-3 bg-red-500 rounded-full" 
                  />
                ))}
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] font-mono leading-none">Signal Active</span>
            </div>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center gap-4 bg-gray-50 pl-1.5 pr-4 py-1.5 rounded-2xl border border-gray-100 shadow-sm">
            {user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-9 h-9 rounded-xl border-2 border-white shadow-md" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-gray-200 shadow-md">
                <UserIcon className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-gray-950 leading-tight uppercase tracking-tight">{user.displayName?.split(' ')[0]}</p>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest font-mono">Verified</p>
            </div>
            <button 
              onClick={() => logout()}
              className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 pb-32">
        {children}
      </main>
      
      {/* Subtle indicator for the "Instrument" feel */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none z-40 lg:hidden">
        <div className="max-w-md mx-auto h-1 w-24 bg-gray-200 rounded-full opacity-50" />
      </footer>
    </div>
  );
}
