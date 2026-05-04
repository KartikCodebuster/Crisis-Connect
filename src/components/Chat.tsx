import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Clock, ShieldCheck } from 'lucide-react';
import { sendMessage, subscribeToMessages, Message } from '../services/dbService';
import { useAuth } from '../hooks/useAuth';

interface ChatProps {
  emergencyId: string;
  recipientName: string;
}

export function Chat({ emergencyId, recipientName }: ChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(emergencyId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [emergencyId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(emergencyId, newMessage.trim());
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[400px] bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
      <div className="bg-gray-950 p-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-black text-white/50 uppercase tracking-widest font-mono">Secure COMMS</p>
            <p className="text-sm font-black text-white">{recipientName}</p>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm transition-all
                  ${msg.senderId === user?.uid 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'}
                `}
              >
                <p>{msg.text}</p>
                <div className={`text-[9px] mt-1 opacity-50 flex items-center gap-1 ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                  <Clock className="w-2.5 h-2.5" />
                  {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message..."
          className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
