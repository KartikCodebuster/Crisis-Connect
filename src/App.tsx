import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { SOSButton } from './components/SOSButton';
import { EmergencyList } from './components/EmergencyList';
import { LiveTrackingMap } from './components/LiveTrackingMap';
import { Circles } from './components/Circles';
import { Profile } from './components/Profile';
import { AdminPanel } from './components/AdminPanel';
import { EmergencyRequest, subscribeToMyRequests, subscribeToMyCircles, subscribeToMyCircleAlerts } from './services/dbService';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, Loader2, Navigation, ShieldAlert, UserCheck, User as UserIcon, Radio } from 'lucide-react';
import { useLocation } from './hooks/useLocation';

function Dashboard() {
  const { latitude, longitude } = useLocation();
  const { user } = useAuth();
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'circles' | 'community' | 'profile' | 'admin'>('home');
  const [guardianAlerts, setGuardianAlerts] = useState<EmergencyRequest[]>([]);
  const [myCircleIds, setMyCircleIds] = useState<string[]>([]);

  const isAdmin = user?.email?.toLowerCase() === 'kartikgkp12@gmail.com';

  useEffect(() => {
    const unsubscribe = subscribeToMyRequests((req) => {
      setActiveRequest(req);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // 1. Get my circles (cached list for alerts)
    const unsubscribeCircles = subscribeToMyCircles((circles) => {
      setMyCircleIds(circles.map(c => c.id));
    });

    return () => unsubscribeCircles();
  }, [user]);

  useEffect(() => {
    if (!user || myCircleIds.length === 0) return;

    // 2. Efficiently listen only for alerts from my circles
    const unsubscribeAlerts = subscribeToMyCircleAlerts(myCircleIds, (emergencies) => {
      // Filter out own requests just in case, though the service likely excludes them
      setGuardianAlerts(emergencies.filter(e => e.requesterId !== user.uid));
    });

    return () => unsubscribeAlerts();
  }, [user, myCircleIds]);

  const navItems = React.useMemo(() => {
    const items = [
      { id: 'home', icon: Shield, label: 'SOS' },
      { id: 'map', icon: Navigation, label: 'Map' },
      { id: 'circles', icon: UserCheck, label: 'Circles' },
      { id: 'community', icon: Users, label: 'Alerts' },
      { id: 'profile', icon: UserIcon, label: 'User' },
    ];
    if (isAdmin) {
      items.push({ id: 'admin', icon: Radio, label: 'Command' });
    }
    return items;
  }, [isAdmin]);

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Guardian Priority Alert */}
        <AnimatePresence>
          {guardianAlerts.length > 0 && (
            <motion.div
              initial={{ y: -100, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -100, opacity: 0, scale: 0.8 }}
              onClick={() => setActiveTab('community')}
              className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-[200] cursor-pointer"
            >
              <div className="bg-red-600 text-white p-5 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(220,38,38,0.6)] border-4 border-white flex items-center gap-5 relative overflow-hidden">
                <motion.div 
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 bg-white"
                />
                <div className="bg-white text-red-600 p-4 rounded-3xl shadow-lg relative z-10">
                  <ShieldAlert className="w-8 h-8 animate-bounce" />
                </div>
                <div className="flex-1 relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-100 leading-none mb-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    Immediate Crisis Response
                  </p>
                  <p className="text-lg font-black font-display tracking-tight leading-none">
                    {guardianAlerts[0].requesterName} needs immediate help!
                  </p>
                </div>
                <div className="bg-white/20 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest relative z-10 backdrop-blur-md">
                  NAVIGATE
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pb-40 pt-4 px-4 md:px-0"
            >
              <SOSButton 
                activeRequest={activeRequest} 
                onShowMap={() => setActiveTab('map')} 
              />
            </motion.div>
          )}
          {activeTab === 'map' && (
            <div key="map" className="fixed inset-0 pb-20">
              <LiveTrackingMap 
                latitude={activeRequest?.location.lat || latitude || 0} 
                longitude={activeRequest?.location.lng || longitude || 0} 
                onBack={() => setActiveTab('home')} 
              />
            </div>
          )}
          {activeTab === 'circles' && (
            <motion.div
              key="circles"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pb-40 pt-4 px-4 md:px-0"
            >
              <Circles />
            </motion.div>
          )}
          {activeTab === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pb-40 pt-4 px-4 md:px-0"
            >
              <EmergencyList />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pb-40 pt-4 px-4 md:px-0"
            >
              <Profile />
            </motion.div>
          )}
          {activeTab === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pb-40 pt-4"
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-50">
          <nav className="bg-gray-950/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-1.5 shadow-2xl flex items-center justify-between gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`relative flex-1 flex flex-col items-center justify-center py-2.5 rounded-[2rem] transition-all duration-300 min-w-0 ${
                    isActive ? 'text-white' : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                  <span className="text-[7px] font-black uppercase tracking-widest truncate w-full px-1 text-center">
                    {item.label}
                  </span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 bg-white/10 rounded-[2rem] -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -bottom-1 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,1)]"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </Layout>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
