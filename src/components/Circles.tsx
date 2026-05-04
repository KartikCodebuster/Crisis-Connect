import React, { useState, useEffect } from 'react';
import { createCircle, joinCircle, subscribeToMyCircles, subscribeToCircleMembers, removeCircleMember, Circle, CircleMember } from '../services/dbService';
import { Users, Plus, Shield, ArrowRight, Loader2, Copy, CheckCircle2, User as UserIcon, ShieldAlert, Trash2, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

interface CircleCardProps {
  key?: React.Key;
  circle: Circle;
  copyCode: (code: string) => void;
  copiedId: string | null;
}

function CircleCard({ circle, copyCode, copiedId }: CircleCardProps) {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const { user } = useAuth();
  const isOwner = user?.uid === circle.ownerId;

  useEffect(() => {
    const unsubscribe = subscribeToCircleMembers(circle.id, setMembers);
    return () => unsubscribe();
  }, [circle.id]);

  const handleRemoveMember = async (targetUserId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from ${circle.name}?`)) return;
    await removeCircleMember(circle.id, targetUserId);
  };

  return (
    <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col gap-6 transition-all hover:border-indigo-100/50 hover:shadow-sm group/card">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-gray-950 tracking-tight text-lg leading-none">{circle.name}</h3>
            {isOwner && (
              <span className="text-[7px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest">You Lead</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <button 
              onClick={() => copyCode(circle.inviteCode)}
              className="flex items-center gap-2 group"
            >
              <span className="text-[10px] font-mono font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-100 flex items-center gap-2">
                CODE: {circle.inviteCode || '···'}
              </span>
              {copiedId === circle.inviteCode ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              ) : circle.inviteCode && (
                <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-400 transition-colors" />
              )}
            </button>
          </div>
        </div>
        <div className="bg-white/50 p-2 rounded-xl backdrop-blur-sm border border-white">
          <ShieldAlert className="w-4 h-4 text-indigo-500" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Active Guardians</span>
          <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">{members.length}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {members.map((member) => {
            const isMemberOwner = member.uid === circle.ownerId;
            const isMe = member.uid === user?.uid;
            
            return (
              <div 
                key={member.uid} 
                className="group/member relative"
              >
                <div className="relative">
                  {member.photoURL ? (
                    <img 
                      src={member.photoURL} 
                      alt={member.displayName || ''} 
                      className={`w-12 h-12 rounded-2xl border-2 shadow-sm object-cover transition-transform group-hover/member:scale-110 ${isMemberOwner ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-white'}`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-2xl bg-white border-2 shadow-sm flex items-center justify-center transition-transform group-hover/member:scale-110 ${isMemberOwner ? 'border-indigo-500' : 'border-white'}`}>
                      <UserIcon className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                  {isMemberOwner && (
                    <div className="absolute -top-1 -right-1 bg-indigo-600 rounded-full p-1 border-2 border-white shadow-sm">
                      <Crown className="w-2 h-2 text-white" />
                    </div>
                  )}
                  
                  {/* Remove action for owner */}
                  {isOwner && !isMe && (
                    <button 
                      onClick={() => handleRemoveMember(member.uid, member.displayName || 'Unknown')}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 border-2 border-white opacity-0 group-hover/member:opacity-100 transition-opacity translate-x-2 -translate-y-2 group-hover/member:translate-x-0 group-hover/member:translate-y-0 shadow-lg"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] font-black uppercase rounded-lg opacity-0 group-hover/member:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-white/10">
                  {isMe ? 'You' : member.displayName || 'Guardian'} {isMemberOwner && '(LEADER)'}
                </div>
              </div>
            );
          })}
          
          {/* Add member button placeholder */}
          <button 
             onClick={() => copyCode(circle.inviteCode)}
             className="w-12 h-12 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50/10 transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Circles() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMyCircles(setCircles);
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsLoading(true);
    await createCircle(newName);
    setNewName('');
    setShowCreate(false);
    setIsLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setIsLoading(true);
    try {
      await joinCircle(inviteCode);
      setInviteCode('');
      setShowJoin(false);
    } catch (err: any) {
      console.error('Join error:', err);
      try {
        const errInfo = JSON.parse(err.message);
        alert(`Failed to join: ${errInfo.error || 'Unknown error'}`);
      } catch {
        alert(err.message || 'Invalid code');
      }
    }
    setIsLoading(false);
  };

  const copyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 blur-3xl -z-10 rounded-full" />
        
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-950 font-display tracking-tight leading-none mb-2">Guardian Hub</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Manage your responder network</p>
          </div>
          <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-100">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-12">
          <button 
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-start gap-4 p-6 bg-indigo-600 rounded-[2.5rem] border border-indigo-400 group transition-all active:scale-95 shadow-xl shadow-indigo-100"
          >
            <div className="bg-white/20 p-2.5 rounded-2xl group-hover:rotate-12 transition-transform backdrop-blur-md">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="block text-[11px] font-black uppercase tracking-widest text-white leading-none mb-1">New Circle</span>
              <span className="block text-[9px] font-bold text-indigo-200">Start a network</span>
            </div>
          </button>
          <button 
            onClick={() => setShowJoin(true)}
            className="flex flex-col items-start gap-4 p-6 bg-white rounded-[2.5rem] border border-gray-100 group transition-all active:scale-95 shadow-sm hover:border-indigo-100"
          >
            <div className="bg-gray-50 p-2.5 rounded-2xl group-hover:-rotate-12 transition-transform">
              <Shield className="w-5 h-5 text-gray-950" />
            </div>
            <div className="text-left">
              <span className="block text-[11px] font-black uppercase tracking-widest text-gray-950 leading-none mb-1">Join Code</span>
              <span className="block text-[9px] font-bold text-gray-400">Enter tactical id</span>
            </div>
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Your Coverage Circles</h4>
            <div className="h-[1px] flex-1 mx-4 bg-gray-50" />
          </div>
          
          {circles.length === 0 ? (
            <div className="p-16 border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center text-center gap-6">
              <div className="bg-gray-50 p-6 rounded-full">
                <Shield className="w-12 h-12 text-gray-200" />
              </div>
              <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-[200px]">
                No active circles found.<br/>Invite family or close friends to start coverage.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {circles.map((circle) => (
                <CircleCard 
                  key={circle.id} 
                  circle={circle} 
                  copyCode={copyCode} 
                  copiedId={copiedId} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showCreate || showJoin) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-950/40 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => { setShowCreate(false); setShowJoin(false); }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8"
              onClick={e => e.stopPropagation()}
            >
              {showCreate ? (
                <form onSubmit={handleCreate} className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-950 font-display tracking-tight mb-2">Establish Circle</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">Internal Name: Family, Home, etc.</p>
                  </div>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Circle Name"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-950 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-950/5"
                    autoFocus
                  />
                  <button 
                    disabled={isLoading}
                    className="w-full bg-gray-950 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Deploy Circle
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-950 font-display tracking-tight mb-2">Join Circle</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">Enter 6-Digit Tactical Invite Code</p>
                  </div>
                  <input 
                    type="text" 
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value)}
                    placeholder="XXXXXX"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-mono text-center text-2xl font-black text-gray-950 tracking-[0.5em] placeholder:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-950/5 uppercase"
                    maxLength={6}
                    autoFocus
                  />
                  <button 
                    disabled={isLoading}
                    className="w-full bg-gray-950 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    Confirm Identity
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
