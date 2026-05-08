import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { SoundManager } from '../utils/SoundManager';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

interface AITutorProps {
  currentSubjectContext?: string | null;
}

export const AITutor = (_props: AITutorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: "Hello! I am Professor Grace AI. How can I help you with your studies today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    SoundManager.playClick();
    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let responseText = "I am currently operating in offline mode. Please refer to your study guides for more information.";
      if (input.toLowerCase().includes("hello") || input.toLowerCase().includes("hi")) {
          responseText = "Hello there! Remember to check your daily syllabus.";
      }
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: responseText }]);
      SoundManager.playHover();
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.3)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-400 overflow-hidden relative shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  <img 
                    src="/assets/avatar_astronaut.png" 
                    alt="Professor Grace"
                    className="w-full h-full object-cover scale-[1.5] origin-top"
                    style={{ filter: isTyping ? 'none' : 'grayscale(20%) brightness(0.8)' }}
                  />
                  {isTyping && (
                      <div className="absolute inset-0 border-2 border-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight">Professor Grace</h3>
                  <p className="text-xs text-indigo-300 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-400 animate-pulse' : 'bg-indigo-400'}`}></span>
                    {isTyping ? 'Typing...' : 'Online'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-slate-900/50">
              <form onSubmit={handleSend} className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={"Ask Professor Grace..."}
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => {
            SoundManager.playClick();
            setIsOpen(!isOpen);
        }}
        className="w-20 h-20 rounded-full bg-slate-900 shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:shadow-[0_0_40px_rgba(99,102,241,0.8)] hover:scale-105 transition-all overflow-hidden border-2 border-indigo-500 relative group"
      >
        <img 
            src="/assets/avatar_astronaut.png" 
            alt="Professor Grace"
            className="w-full h-full object-cover scale-[1.5] origin-top opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 bg-indigo-500/20 mix-blend-overlay"></div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-900 animate-pulse"></div>
      </button>
    </div>
  );
};
